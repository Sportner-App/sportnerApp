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
    footer: "Hesabın yok mu?",
    footerAction: "Kayıt ol",
    helper: "Demo: ahmet / Demo123!",
  },
  register: {
    title: "Aramıza\nkatıl.",
    subtitle: "Kullanıcı adı ve şifreyle hesabını oluştur.",
    submit: "Hesap Oluştur",
    footer: "Zaten hesabın var mı?",
    footerAction: "Giriş yap",
    helper: "Kullanıcı adı: harf, rakam, . ve _",
  },
} satisfies Record<AuthMode, Record<string, string>>;
