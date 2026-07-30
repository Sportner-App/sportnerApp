import { apiClient } from "@/shared/api/client";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
  isOnboarded?: boolean;
  pushToken?: string;
  sports?: string[];
  skillLevels?: Record<string, string>;
  [key: string]: any;
};

export type AuthResponse = {
  token: string;
  userId: string;
  email: string;
  fullName: string;
};

/**
 * Login (.NET API)
 * POST /api/auth/login
 */
export async function signInWithPassword({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  try {
    const response = await apiClient.post<AuthResponse>("/api/Auth/login", {
      email,
      password,
    });

    const { token, userId, email: responseEmail, fullName } = response.data;

    if (!token || !userId) {
      throw new Error("API geçersiz response döndü: token veya userId eksik");
    }

    // User object'i oluştur
    const user: AuthUser = {
      id: userId,
      email: responseEmail,
      fullName,
    };

    // Token ve kullanıcı bilgilerini storage'a kaydet
    await apiClient.setToken(token);
    await apiClient.setUser(user);

    return {
      data: {
        user,
        session: { access_token: token },
      },
      error: null,
    };
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || "Login başarısız";
    console.error("Login error:", error);
    return {
      data: null,
      error: { message },
    };
  }
}

/**
 * Register (.NET API)
 * POST /api/auth/register
 */
export async function signUpWithPassword({
  email,
  password,
  metadata,
}: {
  email: string;
  password: string;
  metadata?: { full_name?: string };
}) {
  try {
    const response = await apiClient.post<AuthResponse>("/api/Auth/register", {
      email,
      password,
      fullName: metadata?.full_name || "",
    });

    const { token, userId, email: responseEmail, fullName } = response.data;

    if (!token || !userId) {
      throw new Error("API geçersiz response döndü: token veya userId eksik");
    }

    // User object'i oluştur
    const user: AuthUser = {
      id: userId,
      email: responseEmail,
      fullName,
    };

    // Token ve kullanıcı bilgilerini storage'a kaydet
    await apiClient.setToken(token);
    await apiClient.setUser(user);

    return {
      data: {
        user,
        session: { access_token: token },
      },
      error: null,
    };
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || "Kayıt başarısız";
    console.error("Register error:", error);
    return {
      data: null,
      error: { message },
    };
  }
}

/**
 * Logout
 * Storage'daki token ve kullanıcı bilgilerini sil
 */
export async function signOut() {
  try {
    await apiClient.clearToken();
    return { error: null };
  } catch (error: any) {
    const message = error?.message || "Logout başarısız";
    console.error("Logout error:", error);
    return { error: { message } };
  }
}

/**
 * Oturum kontrol et
 * Storage'dan token ve user bilgilerini oku
 */
export async function getSession() {
  try {
    const token = await apiClient.getToken();
    const user = await apiClient.getUser();

    if (token && user) {
      return {
        data: {
          session: {
            access_token: token,
            user,
          },
        },
        error: null,
      };
    }

    return { data: { session: null }, error: null };
  } catch (error: any) {
    console.error("Session check error:", error);
    return { data: { session: null }, error: null };
  }
}

/**
 * Password reset iste
 * POST /api/Auth/forgot-password
 */
export async function requestPasswordReset(
  email: string,
  _redirectTo?: string,
) {
  try {
    await apiClient.post("/api/Auth/forgot-password", { email });
    return { error: null };
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Password reset isteği başarısız";
    console.error("Password reset error:", error);
    return { error: { message } };
  }
}

/**
 * Push token güncelle
 * POST /api/Auth/update-push-token
 */
export async function updatePushToken(pushToken: string) {
  try {
    await apiClient.post("/api/Auth/update-push-token", { pushToken });
    return { error: null };
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Push token güncellemesi başarısız";
    console.error("Push token update error:", error);
    return { error: { message } };
  }
}
