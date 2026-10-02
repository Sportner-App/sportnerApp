import i18n from "@/i18n";

type PersonNameParts = {
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
};

/** "Ad Soyad"; ikisi de boşsa boş metin. */
export function formatFullName(
  firstName?: string | null,
  lastName?: string | null,
): string {
  return [firstName, lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
}

/** Kullanıcı adı yoksa genel "sporcu" etiketi (@ işaretsiz). */
export function displayHandle(username?: string | null): string {
  return username?.trim() || i18n.t("events:fallback.athleteHandle");
}

/** `@kullaniciadi`; kullanıcı adı yoksa `@sporcu`. */
export function formatHandle(username?: string | null): string {
  return `@${displayHandle(username)}`;
}

/** Ad Soyad → @kullaniciadi → "Sporcu" sırasıyla ilk dolu olan. */
export function formatPersonName(parts: PersonNameParts): string {
  const full = formatFullName(parts.firstName, parts.lastName);

  if (full) {
    return full;
  }

  if (parts.username?.trim()) {
    return `@${parts.username.trim()}`;
  }

  return i18n.t("events:fallback.athlete");
}
