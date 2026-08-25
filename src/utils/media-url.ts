const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5139";

export function resolveMediaUrl(path: string | null | undefined) {
  const trimmed = path?.trim();
  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `${API_BASE_URL.replace(/\/$/, "")}/${trimmed.replace(/^\//, "")}`;
}
