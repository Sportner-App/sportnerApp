import { useMemo } from "react";

import {
  requestPasswordReset,
  signInWithPassword,
  signOut,
  signUpWithPassword,
} from "@/features/auth/api/auth-service";

export function useAuthActions() {
  return useMemo(
    () => ({
      signIn: signInWithPassword,
      signUp: signUpWithPassword,
      signInWithPassword,
      signUpWithPassword,
      signOut,
      requestPasswordReset,
    }),
    [],
  );
}
