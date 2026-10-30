/**
 * Cihazda saklanan tüm değerlerin anahtarları. Değerler yayındaki kurulumlarda
 * zaten yazılı: bir anahtarı değiştirmek o veriyi (oturum dahil) kaybettirir.
 * Yeni anahtarlar `sportner:` önekiyle eklenir; eskiler geriye dönük uyum için
 * olduğu gibi kalır.
 */
export const STORAGE_KEYS = {
  /** SecureStore — oturum anahtarları. */
  accessToken: "api_token",
  refreshToken: "api_refresh_token",

  /** AsyncStorage */
  user: "api_user",
  pushDeviceIdentifier: "push_device_identifier",
  pushDeviceId: "push_device_id",
  hasSeenOnboarding: "hasSeenOnboarding",
  languagePreference: "sportner:language-preference",
  themePreference: "sportner:theme-preference",
  appTourSeen: "sportner:app-tour:v1",
  dismissedUpdateVersion: "sportner:dismissed-update-version",
} as const;
