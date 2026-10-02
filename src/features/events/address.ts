import { noLocationLabel } from "@/features/events/format";

function isPostcode(value: string) {
  return /^\d{4,6}$/.test(value);
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
  const useful = parts.filter(
    (part) => !isPostcode(part) && !isCountryOrRegion(part),
  );

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
