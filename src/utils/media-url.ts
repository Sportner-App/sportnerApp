import { API_URL } from "@/constants/env";

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

  return `${API_URL.replace(/\/$/, "")}/${trimmed.replace(/^\//, "")}`;
}
