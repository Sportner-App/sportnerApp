import type { PropsWithChildren } from "react";

import { useNotificationService } from "@/shared/services/notification-service";

/**
 * Notification Provider
 * Bildirim servisini başlat
 */
export function NotificationProvider({ children }: PropsWithChildren) {
  useNotificationService();
  return children;
}
