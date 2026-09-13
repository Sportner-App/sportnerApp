import { useMemo } from "react";

import {
  deleteAccount,
  login,
  register,
  resendEmailVerification,
  signInWithApple,
  signInWithGoogle,
  signOut,
  completeExternalRegistration,
  syncPreferredLanguage,
  verifyEmail,
} from "@/services/auth-service";
import type { AuthActions } from "@/types/auth";

export function useAuthActions(): AuthActions {
  return useMemo(
    () => ({
      login,
      register,
      signOut,
      deleteAccount,
      verifyEmail,
      resendEmailVerification,
      syncPreferredLanguage,
      signInWithGoogle,
      signInWithApple,
      completeExternalRegistration,
    }),
    [],
  );
}
