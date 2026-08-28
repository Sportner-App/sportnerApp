import type { AuthMode } from "@/types/auth";
import type { SegmentedTabOption } from "@/types/components";
import type { SelectOption } from "@/types/components";

export const AUTH_MODE_OPTIONS: SegmentedTabOption<AuthMode>[] = [
  { key: "login", label: "Giriş Yap" },
  { key: "register", label: "Kayıt Ol" },
];

export const GENDER_OPTIONS: SelectOption<string>[] = [
  { key: "1", label: "Kadın" },
  { key: "2", label: "Erkek" },
  { key: "0", label: "Belirtmek istemiyorum" },
];

export const AUTH_COPY = {
  login: {
    title: "Tekrar\nhoş geldin.",
    subtitle: "Kullanıcı adın ve şifrenle devam et.",
    submit: "Giriş Yap",
  },
  register: {
    title: "Aramıza\nkatıl.",
    subtitle: "Temel bilgilerini girerek aramıza katıl.",
    submit: "Hesap Oluştur",
    helper: "Kullanıcı adı: harf, rakam, . ve _",
  },
} as const;
