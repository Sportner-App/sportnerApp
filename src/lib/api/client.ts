import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { type AxiosInstance } from "axios";

import { STORAGE_KEYS } from "@/constants/storage-keys";
import { getCurrentAppLanguage, toAcceptLanguageHeader } from "@/i18n";
import { toastService } from "@/lib/toast-bus";
import type {
  ApiFeedbackMessage,
  ApiRequestConfig,
  AuthChangeListener,
  StoredAuthSession,
} from "@/types/api";

import { API_URL } from "@/constants/env";

import { normalizeApiError } from "./errors";
import {
  deleteSecureItem,
  getSecureItem,
  setSecureItem,
} from "./secure-storage";

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

        if (status === 401) {
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
      try {
        const refreshToken = await this.getRefreshToken();
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
