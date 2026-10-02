/**
 * Form doğrulama kuralları. API tarafındaki sınırlarla birebir aynı tutulmalı;
 * hata metinleri her ekranın kendi i18n anahtarında kalır, kurallar burada.
 */

export const USERNAME_PATTERN = /^[a-zA-Z0-9._]+$/;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const EMAIL_MAX_LENGTH = 254;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const PERSON_NAME_MAX_LENGTH = 50;

export const BIRTH_DATE_MIN_AGE = 13;
export const BIRTH_DATE_MAX_AGE = 120;

/** E-posta doğrulama ve şifre sıfırlama kodları. */
export const VERIFICATION_CODE_LENGTH = 6;
export const RESEND_COOLDOWN_SECONDS = 60;

export function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(value.trim());
}
