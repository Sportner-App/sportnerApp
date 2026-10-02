import { Redirect } from "expo-router";

import { useStartupDestination } from "@/features/auth/hooks/use-startup-destination";
import { STARTUP_HREF } from "@/features/auth/startup";

export default function Index() {
  const destination = useStartupDestination();

  if (!destination) {
    return null;
  }

  return <Redirect href={STARTUP_HREF[destination]} />;
}
