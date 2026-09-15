import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import type { PropsWithChildren } from "react";
import { useEffect, useRef } from "react";

import { markNotificationRead } from "@/services/notifications-service";
import { registerCurrentDeviceForPush } from "@/services/push-notifications-service";
import { resolveNotificationRoute } from "@/utils/notification-routing";

import { useAuth } from "./auth-context";
import { InAppNotificationBanner } from "./in-app-notification-banner";

export function PushNotificationsProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const { isReady, isAuthenticated, isOnboarded, userId } = useAuth();
  const handledResponseId = useRef<string | null>(null);

  useEffect(() => {
    if (!isReady || !isAuthenticated || !isOnboarded || !userId) return;

    void registerCurrentDeviceForPush().catch((error) => {
      console.warn("Push notification registration failed:", error);
    });
  }, [isAuthenticated, isOnboarded, isReady, userId]);

  useEffect(() => {
    if (!isReady || !isAuthenticated) return;

    const openResponse = (response: Notifications.NotificationResponse) => {
      const responseId = response.notification.request.identifier;
      if (handledResponseId.current === responseId) return;
      handledResponseId.current = responseId;

      const notificationId =
        response.notification.request.content.data.notificationId;
      if (typeof notificationId === "string") {
        void markNotificationRead(notificationId).catch(() => undefined);
      }

      router.push(
        resolveNotificationRoute(
          response.notification.request.content.data,
        ) as never,
      );
    };

    const subscription =
      Notifications.addNotificationResponseReceivedListener(openResponse);

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) openResponse(response);
    });

    return () => subscription.remove();
  }, [isAuthenticated, isReady, router]);

  return (
    <>
      {children}
      {isReady && isAuthenticated ? <InAppNotificationBanner /> : null}
    </>
  );
}
