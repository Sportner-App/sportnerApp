function readFlag(value: string | undefined) {
  const normalized = value?.trim().toLowerCase();
  return normalized === "true" || normalized === "1";
}

/**
 * true iken login zorunlu değil; UI geliştirme için.
 *
 * - `EXPO_PUBLIC_AUTH_BYPASS` set ise ona bakılır
 * - set değilse: production dışında varsayılan true
 *
 * Production'da mutlaka `EXPO_PUBLIC_AUTH_BYPASS=false` kullan.
 */
export const AUTH_BYPASS =
  process.env.EXPO_PUBLIC_AUTH_BYPASS === undefined
    ? process.env.EXPO_PUBLIC_ENV !== "production"
    : readFlag(process.env.EXPO_PUBLIC_AUTH_BYPASS);
