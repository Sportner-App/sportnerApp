import * as Notifications from "expo-notifications";
import { useRootNavigationState, useRouter } from "expo-router";
import type { PropsWithChildren } from "react";
import { useCallback, useEffect, useRef } from "react";
import { InteractionManager } from "react-native";

import { markNotificationRead } from "@/services/notifications-service";
import { registerCurrentDeviceForPush } from "@/services/push-notifications-service";
import { resolveNotificationRoute } from "@/utils/notification-routing";

import { useAuth } from "./auth-context";
import { InAppNotificationBanner } from "./in-app-notification-banner";

export function PushNotificationsProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const { isReady, isAuthenticated, isOnboarded, userId } = useAuth();
  const handledResponseId = useRef<string | null>(null);

  /**
   * Soğuk açılışta bu sağlayıcı, Stack ağacı kurulmadan önce mount oluyor
   * (AppProviders, Stack'i sarmalıyor). O anda yapılan router.push ya sessizce
   * kayboluyor ya da hemen ardından app/index.tsx'teki başlangıç yönlendirmesi
   * tarafından eziliyordu — kullanıcı bildirime dokunup ana sayfada kalıyordu.
   *
   * Bu yüzden yanıtı navigasyon hazır olana kadar bekletiyoruz. Aynı bildirime
   * uygulama içinden dokunulduğunda sorun görülmemesinin sebebi de buydu:
   * orada ağaç çoktan kurulmuş oluyor.
   */
  const pendingResponse = useRef<Notifications.NotificationResponse | null>(
    null,
  );
  const canNavigate =
    Boolean(navigationState?.key) && isReady && isAuthenticated && isOnboarded;

  useEffect(() => {
    if (!isReady || !isAuthenticated || !isOnboarded || !userId) return;

    void registerCurrentDeviceForPush().catch((error) => {
      console.warn("Push notification registration failed:", error);
    });
  }, [isAuthenticated, isOnboarded, isReady, userId]);

  const handleResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const responseId = response.notification.request.identifier;
      if (handledResponseId.current === responseId) return;
      handledResponseId.current = responseId;

      const notificationId =
        response.notification.request.content.data.notificationId;
      if (typeof notificationId === "string") {
        void markNotificationRead(notificationId).catch(() => undefined);
      }

      // Başlangıç yönlendirmesi aynı karede çalışabiliyor; sıranın sonuna
      // geçerek onun üstüne gidiyoruz.
      InteractionManager.runAfterInteractions(() => {
        router.push(
          resolveNotificationRoute(
            response.notification.request.content.data,
          ) as never,
        );
      });
    },
    [router],
  );

  useEffect(() => {
    if (!isReady || !isAuthenticated) return;

    const openResponse = (response: Notifications.NotificationResponse) => {
      if (!canNavigate) {
        pendingResponse.current = response;
        return;
      }

      handleResponse(response);
    };

    const subscription =
      Notifications.addNotificationResponseReceivedListener(openResponse);

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) openResponse(response);
    });

    return () => subscription.remove();
  }, [canNavigate, handleResponse, isAuthenticated, isReady]);

  // Navigasyon hazır olduğunda bekleyen yanıtı işle.
  useEffect(() => {
    if (!canNavigate) return;

    const response = pendingResponse.current;
    if (!response) return;

    pendingResponse.current = null;
    handleResponse(response);
  }, [canNavigate, handleResponse]);

  return (
    <>
      {children}
      {isReady && isAuthenticated ? <InAppNotificationBanner /> : null}
    </>
  );
}
