import { APP_LINK_BASE_URL } from "@/constants/env";

export function eventShareUrl(eventId: string) {
  const baseUrl = APP_LINK_BASE_URL.replace(/\/+$/, "");
  return `${baseUrl}/share/events/${encodeURIComponent(eventId)}`;
}
