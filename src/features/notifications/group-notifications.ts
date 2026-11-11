import type { ApiNotification } from "@/features/notifications/types";

export type NotificationGroupKey = "today" | "week" | "older";

const DAY_MS = 86_400_000;

/** Liste zaten yeniden eskiye sıralı geliyor; sıra korunur, boş grup dönmez. */
export function groupNotifications(items: ApiNotification[], now = new Date()) {
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const startOfWeek = startOfToday - 6 * DAY_MS;

  const groups: { key: NotificationGroupKey; items: ApiNotification[] }[] = [
    { key: "today", items: [] },
    { key: "week", items: [] },
    { key: "older", items: [] },
  ];

  for (const item of items) {
    const createdAt = new Date(item.createdAt).getTime();
    const index =
      createdAt >= startOfToday ? 0 : createdAt >= startOfWeek ? 1 : 2;
    groups[index].items.push(item);
  }

  return groups.filter((group) => group.items.length > 0);
}
