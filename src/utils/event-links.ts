const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.trim() || "http://localhost:5139";

const APP_LINK_BASE_URL =
  process.env.EXPO_PUBLIC_APP_LINK_BASE_URL?.trim() || API_BASE_URL;

export function eventShareUrl(eventId: string) {
  const baseUrl = APP_LINK_BASE_URL.replace(/\/+$/, "");
  return `${baseUrl}/share/events/${encodeURIComponent(eventId)}`;
}
