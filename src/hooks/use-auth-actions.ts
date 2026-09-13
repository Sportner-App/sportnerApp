import { useMemo } from "react";

import {
  deleteAccount,
  login,
  register,
  signInWithApple,
  signInWithGoogle,
  signOut,
  completeExternalRegistration,
} from "@/services/auth-service";
import type { AuthActions } from "@/types/auth";

export function useAuthActions(): AuthActions {
  return useMemo(
    () => ({
      login,
      register,
      signOut,
      deleteAccount,
      signInWithGoogle,
      signInWithApple,
      completeExternalRegistration,
    }),
    [],
  );
}
