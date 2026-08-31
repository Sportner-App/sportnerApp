import { useRouter } from "expo-router";

import { FIRST_LAUNCH_COPY } from "@/constants/first-launch";
import { useFirstLaunch } from "@/contexts/first-launch-context";

import { FirstLaunchScaffold } from "./first-launch-scaffold";
import { WelcomeVisual } from "./welcome-visual";

export function WelcomeScreen() {
  const router = useRouter();
  const { enterAuthWithoutCompleting } = useFirstLaunch();
  const copy = FIRST_LAUNCH_COPY.welcome;

  return (
    <FirstLaunchScaffold
      title={copy.title}
      subtitle={copy.subtitle}
      visual={<WelcomeVisual />}
      primaryLabel={copy.continue}
      onPrimary={() => router.push("/(first-launch)/intro-1")}
      secondaryHint={copy.loginHint}
      secondaryLabel={copy.login}
      onSecondary={() => {
        enterAuthWithoutCompleting();
        router.replace("/(auth)/login");
      }}
      primaryGlow="subtle"
      accentLine={1}
    />
  );
}
