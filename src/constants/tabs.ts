import type { IconName } from "@/types/components";
import type { AppTabKey } from "@/types/tabs";

export type TabItem = {
  key: AppTabKey;
  label: string;
  icon: IconName;
  /** true ise tab route yerine create ekranına gider */
  isAction?: boolean;
};

export const TAB_ITEMS: TabItem[] = [
  { key: "index", label: "Ana Sayfa", icon: "house" },
  { key: "discover", label: "Keşfet", icon: "compass" },
  { key: "create", label: "Oluştur", icon: "plus", isAction: true },
  { key: "activity", label: "Aktivitelerim", icon: "calendar-check" },
  { key: "profile", label: "Profil", icon: "user" },
];

/** Floating tab bar için içerik alt boşluğu */
export const TAB_BAR_CLEARANCE = 108;
