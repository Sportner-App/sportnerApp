import { noLocationLabel } from "@/features/events/format";

/** Yalnızca sayıdan oluşan parça: posta kodu ya da konumu seçilen pinin koordinatı. */
function isNumberOnly(value: string) {
  return /^-?\d+(\.\d+)?$/.test(value);
}

const MONTHS =
  "ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık";
const LEADING_HOUSE_NUMBER = new RegExp(
  `^\\d{1,3}[a-z]?\\s+(?!(?:${MONTHS})(?:\\s|$))`,
  "i",
);

/**
 * "34710 Moda" ve "33 Dashiell Hammett St" gibi baştaki posta kodunu ve kapı
 * numarasını atar. "19 Mayıs" ve "29 Ekim" gibi tarihli yer adlarına dokunmaz.
 */
function stripNumbers(value: string) {
  return value
    .replace(/^\d{4,6}\s+/, "")
    .replace(/\s+\d{4,6}$/, "")
    .replace(LEADING_HOUSE_NUMBER, "")
    .trim();
}

function isCountryOrRegion(value: string) {
  const normalized = value.toLocaleLowerCase("tr-TR");
  return (
    normalized === "türkiye" ||
    normalized === "turkey" ||
    normalized.endsWith(" bölgesi")
  );
}

function isMajorCity(value: string) {
  const normalized = value.toLocaleLowerCase("tr-TR");
  return (
    normalized === "istanbul" ||
    normalized === "ankara" ||
    normalized === "izmir" ||
    normalized === "bursa" ||
    normalized === "antalya"
  );
}

function isStreet(value: string) {
  return /(bulvarı|bulvar|caddesi|cadde|cad\.?|cd\.?|sokak|sokağı|sk\.?)$/i.test(
    value,
  );
}

function stripMahalle(value: string) {
  return value.replace(/\s+(mahallesi|mah\.?)$/i, "").trim();
}

function shortenPlaceName(value: string) {
  const cleaned = stripMahalle(value);
  if (cleaned.length <= 28) {
    return cleaned;
  }

  return `${cleaned.slice(0, 25)}…`;
}

function addressParts(value: string): string[] {
  const parts: string[] = [];
  let start = 0;

  for (let index = 0; index <= value.length; index += 1) {
    const character = value[index];
    if (index !== value.length && character !== "," && character !== "/") {
      continue;
    }

    const part = value.slice(start, index).trim();
    if (part) {
      parts.push(part);
    }
    start = index + 1;
  }

  return parts;
}

export function shortLocation(address: string): string {
  const trimmed = typeof address === "string" ? address.trim() : "";
  if (!trimmed) {
    return noLocationLabel();
  }

  // Hermes on physical iOS devices can crash inside String.prototype.split
  // for this regex path. Scan the two separators without invoking split.
  const parts = addressParts(trimmed);
  const useful = parts
    .filter((part) => !isNumberOnly(part))
    .map(stripNumbers)
    .filter((part) => part && !isCountryOrRegion(part));

  if (useful.length === 0) {
    return noLocationLabel();
  }

  const districts = useful.filter(
    (part) => !isMajorCity(part) && !isStreet(part),
  );
  const raw =
    (districts.length > 1 ? districts[districts.length - 1] : districts[0]) ??
    useful.find((part) => !isStreet(part)) ??
    useful[0];

  return shortenPlaceName(raw) || noLocationLabel();
}
