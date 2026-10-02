import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { useFirstLaunchCopy } from "@/features/first-launch/copy";
import { useFirstLaunch } from "@/features/first-launch/first-launch-context";

import { FirstLaunchScaffold } from "@/features/first-launch/components/first-launch-scaffold";
import { WelcomeVisual } from "@/features/first-launch/components/welcome-visual";

export function WelcomeScreen() {
  const router = useRouter();
  const { enterAuthWithoutCompleting } = useFirstLaunch();
  const FIRST_LAUNCH_COPY = useFirstLaunchCopy();
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
