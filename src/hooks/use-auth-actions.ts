import { useMemo } from "react";

import { login, register, signOut } from "@/services/auth-service";
import type { AuthActions } from "@/types/auth";

export function useAuthActions(): AuthActions {
  return useMemo(
    () => ({
      login,
      register,
      signOut,
    }),
    [],
  );
}
