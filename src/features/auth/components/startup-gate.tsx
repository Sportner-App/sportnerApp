import { Redirect } from "expo-router";
import type { ReactNode } from "react";

import { useStartupDestination } from "@/features/auth/hooks/use-startup-destination";
import { STARTUP_HREF, type StartupDestination } from "@/features/auth/startup";

type StartupGateProps = {
  /** Bu route grubunun ait olduğu hedef; kullanıcı başka yere aitse yönlendirilir. */
  expect: StartupDestination;
  children: ReactNode;
};

/** Route grubu layout'larının ortak giriş kapısı. */
export function StartupGate({ expect, children }: StartupGateProps) {
  const destination = useStartupDestination();

  if (!destination) {
    return null;
  }

  if (destination !== expect) {
    return <Redirect href={STARTUP_HREF[destination]} />;
  }

  return <>{children}</>;
}
