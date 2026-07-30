/**
 * Field visualization utility functions
 */

export function formatEventDate(dateValue: string) {
  const date = new Date(dateValue);

  return new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getInitials(fullName: string) {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function getSkillLabel(level?: string | null) {
  if (!level) {
    return "Seviye belirtilmedi";
  }

  if (level === "beginner") return "Baslangic";
  if (level === "intermediate") return "Orta";
  if (level === "advanced") return "Ileri";

  return level;
}
