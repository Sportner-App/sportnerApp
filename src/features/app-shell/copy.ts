import { useTranslation } from "react-i18next";

import type { AppTourTarget } from "@/contexts/app-tour-context";

type AppTourStepCopy = { eyebrow: string; title: string; body: string };

export function useAppTourCopy(): Record<AppTourTarget, AppTourStepCopy> {
  const { t } = useTranslation("components");

  return {
    create: {
      eyebrow: t("appTour.create.eyebrow"),
      title: t("appTour.create.title"),
      body: t("appTour.create.body"),
    },
    conversations: {
      eyebrow: t("appTour.conversations.eyebrow"),
      title: t("appTour.conversations.title"),
      body: t("appTour.conversations.body"),
    },
    discover: {
      eyebrow: t("appTour.discover.eyebrow"),
      title: t("appTour.discover.title"),
      body: t("appTour.discover.body"),
    },
  };
}
