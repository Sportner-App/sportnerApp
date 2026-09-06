import { useTranslation } from "react-i18next";

import type { AuthMode } from "@/types/auth";
import type { SegmentedTabOption } from "@/types/components";
import type { SelectOption } from "@/types/components";

/**
 * Cinsiyet seçenekleri — auth ekranı dışında profil düzenleme ve etkinlik
 * filtresinde de kullanılıyor, bu yüzden ayrı bir hook.
 */
export function useGenderOptions(): SelectOption<string>[] {
  const { t } = useTranslation("auth");

  return [
    { key: "1", label: t("gender.female") },
    { key: "2", label: t("gender.male") },
    { key: "0", label: t("gender.unspecified") },
  ];
}

/**
 * Auth ekranının etiket/kopya metinleri. Modül düzeyinde sabit yerine hook:
 * dil değiştiğinde `t()` yeniden değerlendirilsin diye render sırasında
 * çağrılmalı.
 */
export function useAuthCopy() {
  const { t } = useTranslation("auth");
  const GENDER_OPTIONS = useGenderOptions();

  const AUTH_MODE_OPTIONS: SegmentedTabOption<AuthMode>[] = [
    { key: "login", label: t("modes.login") },
    { key: "register", label: t("modes.register") },
  ];

  const AUTH_COPY = {
    login: {
      title: t("copy.login.title"),
      subtitle: t("copy.login.subtitle"),
      submit: t("copy.login.submit"),
    },
    register: {
      title: t("copy.register.title"),
      subtitle: t("copy.register.subtitle"),
      submit: t("copy.register.submit"),
      helper: t("copy.register.helper"),
    },
  } as const;

  return { AUTH_MODE_OPTIONS, GENDER_OPTIONS, AUTH_COPY };
}
