import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import type { PropsWithChildren } from "react";
import { useEffect, useRef } from "react";

import { registerCurrentDeviceForPush } from "@/services/push-notifications-service";
import { NOTIFICATION_ENTITY, NOTIFICATION_TYPE } from "@/types/notifications";

import { useAuth } from "./auth-context";

type PushData = {
  notificationType?: number | string;
  entityType?: number | string;
  entityId?: string;
};

export function PushNotificationsProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const { isReady, isAuthenticated, isOnboarded, userId } = useAuth();
  const handledResponseId = useRef<string | null>(null);

  useEffect(() => {
    if (!isReady || !isAuthenticated || !isOnboarded || !userId) return;

    void registerCurrentDeviceForPush().catch((error) => {
      console.warn("Push notification kaydı başarısız:", error);
    });
  }, [isAuthenticated, isOnboarded, isReady, userId]);

  useEffect(() => {
    if (!isReady || !isAuthenticated) return;

    const openResponse = (response: Notifications.NotificationResponse) => {
      const responseId = response.notification.request.identifier;
      if (handledResponseId.current === responseId) return;
      handledResponseId.current = responseId;

      const data = response.notification.request.content.data as PushData;
      const entityType = Number(data.entityType);
      const notificationType = Number(data.notificationType);
      const entityId = typeof data.entityId === "string" ? data.entityId : null;

      if (!entityId) {
        router.push("/notifications");
        return;
      }

      if (
        notificationType === NOTIFICATION_TYPE.friendRequest ||
        notificationType === NOTIFICATION_TYPE.friendAccepted ||
        entityType === NOTIFICATION_ENTITY.user
      ) {
        router.push(`/users/${entityId}`);
      } else if (entityType === NOTIFICATION_ENTITY.event) {
        router.push(`/events/${entityId}`);
      } else if (entityType === NOTIFICATION_ENTITY.post) {
        router.push(`/posts/${entityId}`);
      } else if (entityType === NOTIFICATION_ENTITY.conversation) {
        router.push("/friends");
      } else if (entityType === NOTIFICATION_ENTITY.badge) {
        router.push("/badges");
      } else {
        router.push("/notifications");
      }
    };

    const subscription =
      Notifications.addNotificationResponseReceivedListener(openResponse);

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) openResponse(response);
    });

    return () => subscription.remove();
  }, [isAuthenticated, isReady, router]);

  return children;
}
