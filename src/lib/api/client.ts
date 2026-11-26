import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { type AxiosInstance } from "axios";
import { Platform } from "react-native";

import { STORAGE_KEYS } from "@/constants/storage-keys";
import i18n, {
  getCurrentAppLanguage,
  toAcceptLanguageHeader,
} from "@/i18n";
import { toastService } from "@/lib/toast-bus";
import type {
  ApiFeedbackMessage,
  ApiRequestConfig,
  AuthChangeListener,
  StoredAuthSession,
} from "@/types/api";

import { API_URL } from "@/constants/env";

import { ApiError, normalizeApiError } from "./errors";
import {
  deleteSecureItem,
  getSecureItem,
  setSecureItem,
} from "./secure-storage";

/** Geçici sunucu hatası (ör. DB bağlantı havuzu dolu) sayılan durum kodları */
const RETRYABLE_SERVER_STATUSES = new Set([500, 502, 503, 504]);
/** GET için en fazla kaç kez yeniden denenir */
const SERVER_RETRY_MAX = 2;
/** Her deneme öncesi taban bekleme (ms): 1. tekrar ~400, 2. tekrar ~1200 */
const SERVER_RETRY_BASE_DELAYS_MS = [400, 1200];
/** Aynı anda düşen isteklerin birlikte dönmemesi için 0-N ms rastgele ek */
const SERVER_RETRY_JITTER_MS = 300;

function isFormData(value: unknown): value is FormData {
  return (
    typeof FormData !== "undefined" &&
    !!value &&
    (value instanceof FormData ||
      typeof (value as FormData).append === "function")
  );
}

type RefreshResponse = {
  userId?: string;
  accessToken?: string;
  refreshToken?: string;
  isNewUser?: boolean;
  isOnboardingCompleted?: boolean;
};

function showFeedback(
  message: ApiFeedbackMessage,
  type: "success" | "error",
  fallbackDescription?: string,
) {
  const payload =
    typeof message === "string" ? { title: message } : { ...message };

  toastService.show({
    ...payload,
    description: payload.description || fallbackDescription,
    type,
  });
}

class APIClient {
  private instance: AxiosInstance;
  private authListeners = new Set<AuthChangeListener>();
  /** Aynı anda birden fazla 401 gelirse tek refresh paylaşılır */
  private refreshPromise: Promise<boolean> | null = null;
  /**
   * Son yenileme geçici bir nedenle mi başarısız oldu (ağ kopması, arka plana
   * atılma, 5xx, 429, 408)? O durumda oturum silinmez; yalnızca sunucu
   * anahtarı açıkça reddederse (ör. 401/400) çıkış yapılır.
   */
  private lastRefreshWasTransientFailure = false;

  constructor() {
    this.instance = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.instance.interceptors.request.use(async (config) => {
      if (isFormData(config.data)) {
        config.headers?.delete("Content-Type");
      }

      // Backend, doğrulama/hata mesajlarını Accept-Language'e göre
      // yerelleştiriyor (bkz. LocalizationExtension.cs, en-US/tr-TR).
      // Uygulama dili değişse bile sunucudan gelen metinler seçili dille
      // eşleşsin diye her istekte güncel dili gönderiyoruz.
      config.headers["Accept-Language"] = toAcceptLanguageHeader(
        getCurrentAppLanguage(),
      );

      try {
        const token = await getSecureItem(STORAGE_KEYS.accessToken);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.warn("Token okunamadi:", error);
        // iOS'ta telefon kilitliyken Keychain okuması hata verir. İsteği
        // token'sız göndermek 401 -> refresh -> oturum silme zincirini
        // tetikler; bunun yerine ağ hatası gibi reddet. Giriş vb. auth
        // istekleri token gerektirmez, devam eder.
        if (Platform.OS === "ios" && !config.url?.startsWith("/api/auth/")) {
          throw new ApiError({
            message: i18n.t("api:networkError"),
            code: "TOKEN_UNREADABLE",
            isNetworkError: true,
            cause: error,
          });
        }
      }
      return config;
    });

    this.instance.interceptors.response.use(
      (response) => {
        const feedback = (response.config as ApiRequestConfig).feedback;

        if (feedback?.success) {
          showFeedback(feedback.success, "success");
        }

        return response;
      },
      async (error) => {
        const config = error.config as ApiRequestConfig | undefined;
        const status = error.response?.status;

        // Geçici sunucu hatasında GET'i gecikmeyle yeniden dene. Tekrar edilen
        // istek kendi interceptor zincirinden geçer (feedback orada bir kez
        // gösterilir); burada doğrudan sonucunu döndürüyoruz.
        if (
          config &&
          config.method?.toLowerCase() === "get" &&
          status !== undefined &&
          RETRYABLE_SERVER_STATUSES.has(status) &&
          !config.signal?.aborted &&
          (config._serverRetryCount ?? 0) < SERVER_RETRY_MAX
        ) {
          const attempt = config._serverRetryCount ?? 0;
          const delay =
            SERVER_RETRY_BASE_DELAYS_MS[attempt] +
            Math.random() * SERVER_RETRY_JITTER_MS;
          await new Promise((resolve) => setTimeout(resolve, delay));

          if (!config.signal?.aborted) {
            config._serverRetryCount = attempt + 1;
            return this.instance.request(config);
          }
        }

        if (
          status === 401 &&
          config &&
          !config.skipAuthRefresh &&
          !config._retry
        ) {
          const refreshed = await this.refreshSession();

          if (refreshed) {
            config._retry = true;
            return this.instance.request(config);
          }
        }

        if (status === 401 && !this.lastRefreshWasTransientFailure) {
          await this.clearToken();
        }

        const apiError = normalizeApiError(error);
        const feedback = config?.feedback;

        if (feedback?.error) {
          showFeedback(feedback.error, "error", apiError.message);
        }

        return Promise.reject(apiError);
      },
    );
  }

  subscribeToAuthChanges(listener: AuthChangeListener) {
    this.authListeners.add(listener);

    return () => {
      this.authListeners.delete(listener);
    };
  }

  private notifyAuthChange() {
    this.authListeners.forEach((listener) => listener());
  }

  /**
   * Access token düştüğünde (401) çağrılır.
   * Boot'ta proaktif çağrılmaz.
   */
  async refreshSession(): Promise<boolean> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      this.lastRefreshWasTransientFailure = false;
      try {
        // Kilitli Keychain hatası catch'e düşer; status olmadığı için geçici
        // sayılır ve oturum korunur. Gerçekten null ise oturum yok demektir.
        const refreshToken = await this.readStoredToken(
          STORAGE_KEYS.refreshToken,
        );
        const existingUser = await this.getUser();

        if (!refreshToken) {
          return false;
        }

        const response = await this.post<
          RefreshResponse,
          { refreshToken: string }
        >("/api/auth/refresh", { refreshToken }, { skipAuthRefresh: true });

        const body = response.data;
        if (!body?.accessToken || !body?.refreshToken) {
          return false;
        }

        await this.setSession({
          accessToken: body.accessToken,
          refreshToken: body.refreshToken,
          user: existingUser
            ? {
                ...existingUser,
                id: body.userId || existingUser.id,
                isOnboarded:
                  body.isOnboardingCompleted ?? existingUser.isOnboarded,
                isNewUser: body.isNewUser ?? existingUser.isNewUser,
              }
            : undefined,
        });

        return true;
      } catch (error) {
        console.warn("Token refresh failed:", error);
        // Yanıt yoksa (ağ hatası) ya da geçici sunucu durumuysa oturumu koru.
        const status = (error as { status?: number })?.status;
        this.lastRefreshWasTransientFailure =
          !status || status >= 500 || status === 429 || status === 408;
        return false;
      }
    })();

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  async setSession(session: StoredAuthSession) {
    try {
      await setSecureItem(STORAGE_KEYS.accessToken, session.accessToken);
      await setSecureItem(STORAGE_KEYS.refreshToken, session.refreshToken);

      if (session.user) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.user,
          JSON.stringify(session.user),
        );
      }
    } catch (error) {
      console.error("Session kaydedilemedi:", error);
      throw error;
    } finally {
      this.notifyAuthChange();
    }
  }

  async setToken(token: string | null | undefined) {
    try {
      if (!token) {
        await deleteSecureItem(STORAGE_KEYS.accessToken);
        return;
      }
      await setSecureItem(STORAGE_KEYS.accessToken, token);
    } catch (error) {
      console.error("Token kaydedilemedi:", error);
      throw error;
    } finally {
      this.notifyAuthChange();
    }
  }

  async setRefreshToken(token: string | null | undefined) {
    try {
      if (!token) {
        await deleteSecureItem(STORAGE_KEYS.refreshToken);
        return;
      }
      await setSecureItem(STORAGE_KEYS.refreshToken, token);
    } catch (error) {
      console.error("Refresh token kaydedilemedi:", error);
      throw error;
    }
  }

  async clearToken() {
    try {
      await deleteSecureItem(STORAGE_KEYS.accessToken);
      await deleteSecureItem(STORAGE_KEYS.refreshToken);
      await AsyncStorage.removeItem(STORAGE_KEYS.user);
    } catch (error) {
      console.error("Token silinirken hata:", error);
    } finally {
      this.notifyAuthChange();
    }
  }

  async setUser(user: Record<string, unknown> | null | undefined) {
    try {
      if (!user) {
        await AsyncStorage.removeItem(STORAGE_KEYS.user);
        return;
      }
      await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    } catch (error) {
      console.error("Kullanıcı bilgileri kaydedilemedi:", error);
      throw error;
    } finally {
      this.notifyAuthChange();
    }
  }

  async getUser() {
    try {
      const userJson = await AsyncStorage.getItem(STORAGE_KEYS.user);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error("Kullanıcı bilgileri okunamadi:", error);
      return null;
    }
  }

  /**
   * iOS'ta okuma hatasını FIRLATIR (kilitli Keychain geçicidir). Android'de
   * hata kalıcı olabilir (çözülemeyen Keystore kaydı); kullanıcı bozuk oturumda
   * takılmasın diye "kayıt yok" sayılır.
   */
  private async readStoredToken(key: string) {
    try {
      return await getSecureItem(key);
    } catch (error) {
      if (Platform.OS === "ios") throw error;
      console.error("Token okunamadi:", error);
      return null;
    }
  }

  /** Saklı token'ları okur; iOS'ta okuma hatasını fırlatır. */
  async readStoredTokens() {
    const accessToken = await this.readStoredToken(STORAGE_KEYS.accessToken);
    const refreshToken = await this.readStoredToken(STORAGE_KEYS.refreshToken);
    return { accessToken, refreshToken };
  }

  async getToken() {
    try {
      return await getSecureItem(STORAGE_KEYS.accessToken);
    } catch (error) {
      console.error("Token okunamadi:", error);
      return null;
    }
  }

  async getRefreshToken() {
    try {
      return await getSecureItem(STORAGE_KEYS.refreshToken);
    } catch (error) {
      console.error("Refresh token okunamadi:", error);
      return null;
    }
  }

  get<T = unknown>(url: string, config?: ApiRequestConfig) {
    return this.instance.get<T>(url, config);
  }

  post<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: ApiRequestConfig<D>,
  ) {
    return this.instance.post<T>(url, data, config);
  }

  put<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: ApiRequestConfig<D>,
  ) {
    return this.instance.put<T>(url, data, config);
  }

  patch<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: ApiRequestConfig<D>,
  ) {
    return this.instance.patch<T>(url, data, config);
  }

  delete<T = unknown>(url: string, config?: ApiRequestConfig) {
    return this.instance.delete<T>(url, config);
  }
}

export const apiClient = new APIClient();
