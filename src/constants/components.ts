import { Platform } from "react-native";
import { useTranslation } from "react-i18next";

import type { AppTourTarget } from "@/contexts/app-tour-context";
import type { IconName } from "@/types/components";
import type { DirectionsApp } from "@/utils/open-directions";
import type { MediaSource } from "@/utils/media-picker";

type AppTourStepCopy = { eyebrow: string; title: string; body: string };

type DirectionsOption = {
  key: DirectionsApp;
  label: string;
  description: string;
  icon: IconName;
};

type MediaSourceOption = {
  key: MediaSource;
  icon: IconName;
  label: string;
  description: string;
};

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

export function useDirectionsOptions(): DirectionsOption[] {
  const { t } = useTranslation("components");

  const options: DirectionsOption[] = [
    {
      key: "apple",
      label: t("directions.apple.label"),
      description: t("directions.apple.description"),
      icon: "apple",
    },
    {
      key: "google",
      label: t("directions.google.label"),
      description: t("directions.google.description"),
      icon: "google",
    },
    {
      key: "yandex",
      label: t("directions.yandex.label"),
      description: t("directions.yandex.description"),
      icon: "diamond-turn-right",
    },
  ];

  return Platform.OS === "android"
    ? options.filter((option) => option.key !== "apple")
    : options;
}

export function useMediaSourceOptions(): MediaSourceOption[] {
  const { t } = useTranslation("components");

  return [
    {
      key: "camera",
      icon: "camera",
      label: t("mediaSource.camera.label"),
      description: t("mediaSource.camera.description"),
    },
    {
      key: "gallery",
      icon: "images",
      label: t("mediaSource.gallery.label"),
      description: t("mediaSource.gallery.description"),
    },
  ];
}
