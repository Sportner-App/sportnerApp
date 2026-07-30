import { apiClient } from "@/shared/api/client";

type AuthRoute = "/(tabs)" | "/(onboarding)";

type ProfileResponse = {
  userId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
  isOnboarded: boolean;
  pushToken?: string;
  sports?: string[];
  skillLevels?: Record<string, string>;
};

export async function resolvePostAuthRoute(userId: string): Promise<AuthRoute> {
  try {
    const { data } = await apiClient.get<ProfileResponse>(
      `/api/profiles/${userId}`,
    );
    return data?.isOnboarded ? "/(tabs)" : "/(onboarding)";
  } catch (error) {
    // Profil bilgisi alınamadıysa (404, etc), onboarding ekranına yönlendir
    // Kullanıcı zaten onboarded ise tabs'e gidecek, değilse onboarding yapacak
    console.debug(
      "Profil kontrolü başarısız, onboarding ekranına yönlendiriliyor",
    );
    return "/(onboarding)";
  }
}
