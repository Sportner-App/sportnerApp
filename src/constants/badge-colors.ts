/**
 * Etkinlik kartı rozet renkleri.
 *
 * Kural: aynı kartta hiçbir rozet bir diğeriyle (veya spor aksanıyla) aynı/yakın
 * renkte olmaz. Her rozet türünün kendi renk ailesi vardır; bir aday spor
 * aksanına ya da daha önce seçilmiş bir rozete çok yakınsa aynı aileden bir
 * sonraki aday seçilir. Her listenin sonundaki nötr beyaz, her koşulda geçerli
 * bir çıkış kapısıdır (tüm doygun renklerden uzaktır).
 */

export type BadgeTheme = {
  background: string;
  foreground: string;
};

/** İki rengin "aynı sayılacak kadar yakın" olduğu RGB mesafe eşiği. */
const COLLISION_DISTANCE = 85;

/**
 * Bir aile tükendiğinde kullanılan nötr merdiven. Üçü de birbirinden ve tüm
 * doygun renklerden uzak; böylece iki rozet asla aynı nötre düşemez.
 */
const NEUTRAL_LADDER = ["#f4f6f2", "#0b1622", "#94a3b8"];

/** Seviye rozeti — mor / fuşya ailesi */
const SKILL_FAMILY = ["#8b5cf6", "#e879f9", "#6366f1", ...NEUTRAL_LADDER];

/** Ücretsiz — yeşil / teal ailesi */
const FREE_FAMILY = ["#2dd4bf", "#10b981", "#34d399", ...NEUTRAL_LADDER];

/** Ücretli — amber / sarı ailesi */
const PAID_FAMILY = ["#f59e0b", "#facc15", "#fb923c", ...NEUTRAL_LADDER];

/** Bugün — kırmızı / rose ailesi (aciliyet) */
const TODAY_FAMILY = ["#f43f5e", "#ef4444", "#fb7185", ...NEUTRAL_LADDER];

/** Yarın ve sonrası — mavi ailesi */
const UPCOMING_FAMILY = ["#38bdf8", "#0ea5e9", "#22d3ee", ...NEUTRAL_LADDER];

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  const normalized =
    value.length === 3
      ? value
          .split("")
          .map((character) => character + character)
          .join("")
      : value;

  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function isTooClose(a: string, b: string) {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);

  return Math.hypot(r1 - r2, g1 - g2, b1 - b2) < COLLISION_DISTANCE;
}

/** Arka plan rengine göre okunabilir metin rengi. */
export function readableOn(background: string) {
  const [r, g, b] = hexToRgb(background);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.6 ? "#06111a" : "#ffffff";
}

/** Aileden, kullanılan renklerin hiçbirine yakın olmayan ilk adayı seçer. */
function pickDistinct(family: string[], used: string[]) {
  return (
    family.find((candidate) =>
      used.every((usedColor) => !isTooClose(candidate, usedColor)),
    ) ?? NEUTRAL_LADDER[NEUTRAL_LADDER.length - 1]
  );
}

function toTheme(background: string): BadgeTheme {
  return { background, foreground: readableOn(background) };
}

export type EventUrgency = "today" | "upcoming";

/**
 * Bir etkinlik kartındaki rozetlerin renklerini birbirine çakışmayacak
 * şekilde çözer. Spor aksanı sabittir (branş kimliği), diğerleri ona ve
 * birbirlerine göre seçilir.
 */
export function resolveEventBadgeThemes({
  sportAccent,
  isPaid,
  urgency,
}: {
  sportAccent: string;
  isPaid: boolean;
  urgency: EventUrgency | null;
}): { skill: BadgeTheme; fee: BadgeTheme; date: BadgeTheme } {
  const used = [sportAccent];

  const skill = pickDistinct(SKILL_FAMILY, used);
  used.push(skill);

  const fee = pickDistinct(isPaid ? PAID_FAMILY : FREE_FAMILY, used);
  used.push(fee);

  const dateFamily = urgency === "today" ? TODAY_FAMILY : UPCOMING_FAMILY;
  const date = pickDistinct(dateFamily, used);

  return {
    skill: toTheme(skill),
    fee: toTheme(fee),
    date: toTheme(date),
  };
}
