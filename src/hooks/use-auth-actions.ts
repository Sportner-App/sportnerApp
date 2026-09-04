import { useMemo } from "react";

import {
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
      signInWithGoogle,
      signInWithApple,
      completeExternalRegistration,
    }),
    [],
  );
}
