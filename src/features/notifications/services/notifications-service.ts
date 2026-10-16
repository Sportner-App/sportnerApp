import { apiClient } from "@/lib/api/client";
import { toCursorPage } from "@/lib/api/pagination";
import type { CursorPagedResult } from "@/types/api";
import type {
  ApiNotification,
  ApiNotificationSetting,
} from "@/features/notifications/types";

export async function listNotifications(
  params: {
    unreadOnly?: boolean;
    before?: string;
    limit?: number;
  } = {},
): Promise<CursorPagedResult<ApiNotification>> {
  const response = await apiClient.get<CursorPagedResult<ApiNotification>>(
    "/api/notifications",
    {
      params: {
        unreadOnly: params.unreadOnly ?? false,
        before: params.before,
        limit: params.limit ?? 30,
      },
    },
  );

  const page = toCursorPage(response.data);
  return { ...page, hasMore: Boolean(page.nextCursor) };
}

export async function hasUnreadNotifications(): Promise<boolean> {
  const page = await listNotifications({ unreadOnly: true, limit: 1 });
  return page.items.length > 0;
}

export async function markNotificationRead(id: string) {
  await apiClient.post(`/api/notifications/${id}/read`);
}

export async function markAllNotificationsRead() {
  await apiClient.post("/api/notifications/read-all");
}

export async function deleteNotification(id: string) {
  await apiClient.delete(`/api/notifications/${id}`);
}

export async function getNotificationSettings(): Promise<
  ApiNotificationSetting[]
> {
  const response = await apiClient.get<ApiNotificationSetting[]>(
    "/api/notification-settings",
  );
  return response.data ?? [];
}

export async function updateNotificationSetting(
  type: number,
  payload: {
    inAppEnabled: boolean;
    pushEnabled: boolean;
    emailEnabled: boolean;
  },
) {
  await apiClient.put(`/api/notification-settings/${type}`, payload);
}

/**
 * Birden çok türü tek istekte günceller. Ayarlar ekranındaki bir anahtar
 * onlarca türü birden değiştiriyor; tür başına istek atılsa yarısı başarısız
 * olduğunda ekran grubu kapalı gösterirken bir kısmı açık kalırdı.
 */
export async function updateNotificationSettings(
  settings: {
    notificationType: number;
    inAppEnabled: boolean;
    pushEnabled: boolean;
    emailEnabled: boolean;
  }[],
) {
  await apiClient.put("/api/notification-settings", { settings });
}
