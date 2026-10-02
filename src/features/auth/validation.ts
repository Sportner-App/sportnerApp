import {
  EMAIL_MAX_LENGTH,
  EMAIL_PATTERN,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
} from "@/constants/validation";
import i18n from "@/i18n";

/**
 * Servis katmanının son savunma hattı: form doğrulamasını atlayan bir çağrı
 * API'ye bozuk veri göndermesin. Hata metni döner, geçerliyse null.
 */

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/** Girişte yalnızca uzunluk, kayıtta karakter kuralları da kontrol edilir. */
export function validateUsername(
  username: string,
  forRegister: boolean,
): string | null {
  const normalized = normalizeUsername(username);

  if (!normalized) {
    return i18n.t("auth:validation.usernameRequired");
  }

  if (normalized.length > USERNAME_MAX_LENGTH) {
    return i18n.t("auth:validation.usernameTooLong", {
      max: USERNAME_MAX_LENGTH,
    });
  }

  if (forRegister) {
    if (normalized.length < USERNAME_MIN_LENGTH) {
      return i18n.t("auth:validation.usernameTooShort", {
        min: USERNAME_MIN_LENGTH,
      });
    }

    if (!USERNAME_PATTERN.test(normalized)) {
      return i18n.t("auth:validation.usernameInvalidChars");
    }
  }

  return null;
}

export function validatePassword(
  password: string,
  forRegister: boolean,
): string | null {
  if (!password) {
    return i18n.t("auth:validation.passwordRequired");
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    return i18n.t("auth:validation.passwordTooLong");
  }

  if (forRegister && password.length < PASSWORD_MIN_LENGTH) {
    return i18n.t("auth:validation.passwordTooShort", {
      min: PASSWORD_MIN_LENGTH,
    });
  }

  return null;
}

export function validateEmail(email: string): string | null {
  if (!email) {
    return i18n.t("auth:validation.emailRequired");
  }

  if (email.length > EMAIL_MAX_LENGTH) {
    return i18n.t("auth:validation.emailTooLong", {
      max: EMAIL_MAX_LENGTH,
    });
  }

  if (!EMAIL_PATTERN.test(email)) {
    return i18n.t("auth:validation.emailInvalid");
  }

  return null;
}
