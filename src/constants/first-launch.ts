import { useTranslation } from "react-i18next";

export const HAS_SEEN_ONBOARDING_KEY = "hasSeenOnboarding";

export function useFirstLaunchCopy() {
  const { t } = useTranslation("firstLaunch");

  return {
    welcome: {
      title: t("welcome.title"),
      subtitle: t("welcome.subtitle"),
      continue: t("welcome.continue"),
      loginHint: t("welcome.loginHint"),
      login: t("welcome.login"),
    },
    intro1: {
      title: t("intro1.title"),
      subtitle: t("intro1.subtitle"),
      next: t("intro1.next"),
    },
    intro2: {
      title: t("intro2.title"),
      subtitle: t("intro2.subtitle"),
      next: t("intro2.next"),
    },
    intro3: {
      title: t("intro3.title"),
      subtitle: t("intro3.subtitle"),
      next: t("intro3.next"),
    },
    skip: t("skip"),
  } as const;
}
