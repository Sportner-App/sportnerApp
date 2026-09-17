import { useMemo } from "react";

import {
  deleteAccount,
  login,
  register,
  requestPasswordReset,
  resendEmailVerification,
  resetPassword,
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
      requestPasswordReset,
      resetPassword,
      syncPreferredLanguage,
      signInWithGoogle,
      signInWithApple,
      completeExternalRegistration,
    }),
    [],
  );
}
