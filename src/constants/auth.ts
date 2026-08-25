import type { AuthMode } from "@/types/auth";
import type { SegmentedTabOption } from "@/types/components";

export const AUTH_MODE_OPTIONS: SegmentedTabOption<AuthMode>[] = [
  { key: "login", label: "Giriş Yap" },
  { key: "register", label: "Kayıt Ol" },
];

export const AUTH_COPY = {
  login: {
    title: "Tekrar\nhoş geldin.",
    subtitle: "Kullanıcı adın ve şifrenle devam et.",
    submit: "Giriş Yap",
  },
  register: {
    title: "Aramıza\nkatıl.",
    subtitle: "Adın, kullanıcı adın ve şifrenle başla.",
    submit: "Hesap Oluştur",
    helper: "Kullanıcı adı: harf, rakam, . ve _",
  },
} as const;
