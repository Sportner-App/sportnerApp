import { useRouter } from "expo-router";
import { useEffect } from "react";

import { AuthForm, useAuth } from "@/features/auth";

export function LoginScreen() {
  const router = useRouter();
  const { isAuthenticated, isReady } = useAuth();

  useEffect(() => {
    // Kullanıcı zaten giriş yapmışsa, login ekranını atla
    if (isReady && isAuthenticated) {
      router.replace("/(tabs)");
    }
  }, [isReady, isAuthenticated, router]);

  return <AuthForm />;
}
