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
      signInWithGoogle,
      signInWithApple,
      completeExternalRegistration,
    }),
    [],
  );
}
