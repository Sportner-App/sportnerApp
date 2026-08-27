import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { type AxiosInstance } from "axios";

import { toastService } from "@/services/toast-service";
import type {
  ApiFeedbackMessage,
  ApiRequestConfig,
  AuthChangeListener,
  StoredAuthSession,
} from "@/types/api";

import { normalizeApiError } from "./errors";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5139";

const TOKEN_STORAGE_KEY = "api_token";
const REFRESH_TOKEN_STORAGE_KEY = "api_refresh_token";
const USER_STORAGE_KEY = "api_user";

function isFormData(value: unknown): value is FormData {
  return (
    typeof FormData !== "undefined" &&
    !!value &&
    (value instanceof FormData || typeof (value as FormData).append === "function")
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
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.instance.interceptors.request.use(async (config) => {
      if (isFormData(config.data)) {
        config.headers?.delete("Content-Type");
      }

      try {
        const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
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

        const response = await this.instance.post<RefreshResponse>(
          "/api/auth/refresh",
          { refreshToken },
          { skipAuthRefresh: true },
        );

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
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, session.accessToken);
      await AsyncStorage.setItem(
        REFRESH_TOKEN_STORAGE_KEY,
        session.refreshToken,
      );

      if (session.user) {
        await AsyncStorage.setItem(
          USER_STORAGE_KEY,
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
        await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
        return;
      }
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
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
        await AsyncStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
        return;
      }
      await AsyncStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token);
    } catch (error) {
      console.error("Refresh token kaydedilemedi:", error);
      throw error;
    }
  }

  async clearToken() {
    try {
      await AsyncStorage.multiRemove([
        TOKEN_STORAGE_KEY,
        REFRESH_TOKEN_STORAGE_KEY,
        USER_STORAGE_KEY,
      ]);
    } catch (error) {
      console.error("Token silinirken hata:", error);
    } finally {
      this.notifyAuthChange();
    }
  }

  async setUser(user: Record<string, unknown> | null | undefined) {
    try {
      if (!user) {
        await AsyncStorage.removeItem(USER_STORAGE_KEY);
        return;
      }
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
      console.error("Kullanıcı bilgileri kaydedilemedi:", error);
      throw error;
    } finally {
      this.notifyAuthChange();
    }
  }

  async getUser() {
    try {
      const userJson = await AsyncStorage.getItem(USER_STORAGE_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error("Kullanıcı bilgileri okunamadi:", error);
      return null;
    }
  }

  async getToken() {
    try {
      return await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    } catch (error) {
      console.error("Token okunamadi:", error);
      return null;
    }
  }

  async getRefreshToken() {
    try {
      return await AsyncStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
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
