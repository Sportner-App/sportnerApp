import i18n from "@/i18n";

const TURKISH_CHAR_MAP: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u",
};

/** Ad soyaddan Türkçe karakterleri sadeleştirip rastgele 4 haneli ekle kullanıcı adı önerir. */
export function suggestUsername(firstName?: string, lastName?: string) {
  const base = `${firstName ?? ""}${lastName ?? ""}`
    .toLowerCase()
    .replace(/[çğıöşü]/g, (char) => TURKISH_CHAR_MAP[char] ?? char)
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20);

  const suffix = Math.floor(1000 + Math.random() * 9000);

  return `${base || i18n.t("events:fallback.athleteHandle")}${suffix}`;
}
