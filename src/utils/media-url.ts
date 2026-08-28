const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5139";

export function resolveMediaUrl(path: string | null | undefined) {
  const trimmed = path?.trim();
  if (!trimmed) {
    return "";
  }

  // ImagePicker / ImageManipulator local URIs (file:, content:, ph:) and
  // already absolute remote/data URIs must not be prefixed with the API URL.
  if (/^[a-z][a-z\d+.-]*:/i.test(trimmed)) {
    return trimmed;
  }

  return `${API_BASE_URL.replace(/\/$/, "")}/${trimmed.replace(/^\//, "")}`;
}
