import type { IconName } from "@/types/components";
import type { AppTabKey } from "@/types/tabs";

export type TabItem = {
  key: AppTabKey;
  /** i18n `tabs` namespace anahtarı; etiket render sırasında `t()` ile çözülür. */
  labelKey: "events" | "discover" | "create" | "activity" | "profile";
  icon: IconName;
  /** true ise tab route yerine create ekranına gider */
  isAction?: boolean;
};

export const TAB_ITEMS: TabItem[] = [
  { key: "index", labelKey: "events", icon: "house" },
  { key: "discover", labelKey: "discover", icon: "compass" },
  {
    key: "create",
    labelKey: "create",
    icon: "calendar-plus",
    isAction: true,
  },
  { key: "activity", labelKey: "activity", icon: "calendar-check" },
  { key: "profile", labelKey: "profile", icon: "user" },
];

/** Floating tab bar için içerik alt boşluğu */
export const TAB_BAR_CLEARANCE = 108;
