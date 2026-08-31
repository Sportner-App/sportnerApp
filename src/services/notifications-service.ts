import { apiClient } from "@/lib/api/client";
import type { CursorPagedResult } from "@/types/api";
import type {
  ApiNotification,
  ApiNotificationSetting,
} from "@/types/notifications";

export async function listNotifications(params: {
  unreadOnly?: boolean;
  before?: string;
  limit?: number;
} = {}): Promise<CursorPagedResult<ApiNotification>> {
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

  return {
    items: response.data?.items ?? [],
    nextCursor: response.data?.nextCursor ?? null,
    hasMore: Boolean(response.data?.nextCursor),
  };
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
