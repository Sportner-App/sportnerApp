import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";


const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5139";

const TOKEN_STORAGE_KEY = "api_token";
const USER_STORAGE_KEY = "api_user";

/**
 * API istemcisi - .NET Web API ile iletişim kurar
 * Token'ı AsyncStorage'dan oku ve Authorization header'ına ekle
 */
class APIClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor: Token'ı Authorization header'ına ekle
    this.instance.interceptors.request.use(async (config) => {
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

    // Response interceptor: Error handling
    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expire olmuş, oturum kapat
          await this.clearToken();
        }
        return Promise.reject(error);
      },
    );
  }

  /**
   * Token'ı AsyncStorage'a kaydet
   */
  async setToken(token: string | null | undefined) {
    try {
      if (!token) {
        // Token null/undefined ise, mevcut token'ı sil
        await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
        return;
      }
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch (error) {
      console.error("Token kaydedilemedi:", error);
      throw error;
    }
  }

  /**
   * Token'ı AsyncStorage'dan sil
   */
  async clearToken() {
    try {
      await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
    } catch (error) {
      console.error("Token silinirken hata:", error);
    }
  }

  /**
   * Kullanıcı bilgilerini AsyncStorage'a kaydet
   */
  async setUser(user: Record<string, any> | null | undefined) {
    try {
      if (!user) {
        // User null/undefined ise, mevcut user bilgisini sil
        await AsyncStorage.removeItem(USER_STORAGE_KEY);
        return;
      }
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
      console.error("Kullanıcı bilgileri kaydedilemedi:", error);
      throw error;
    }
  }

  /**
   * Kullanıcı bilgilerini AsyncStorage'dan oku
   */
  async getUser() {
    try {
      const userJson = await AsyncStorage.getItem(USER_STORAGE_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error("Kullanıcı bilgileri okunamadi:", error);
      return null;
    }
  }

  /**
   * Kayıtlı token'ı oku
   */
  async getToken() {
    try {
      return await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    } catch (error) {
      console.error("Token okunamadi:", error);
      return null;
    }
  }

  /**
   * GET isteği
   */
  get<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.instance.get<T>(url, config);
  }

  /**
   * POST isteği
   */
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.instance.post<T>(url, data, config);
  }

  /**
   * PUT isteği
   */
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.instance.put<T>(url, data, config);
  }

  /**
   * PATCH isteği
   */
  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.instance.patch<T>(url, data, config);
  }

  /**
   * DELETE isteği
   */
  delete<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.instance.delete<T>(url, config);
  }
}

export const apiClient = new APIClient();

/**
 * AsyncStorage'dan token'ı al (multipart upload vb. için)
 */
export async function getStoredToken(): Promise<string | null> {
  return apiClient.getToken();
}
