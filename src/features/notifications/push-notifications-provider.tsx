import * as Notifications from "expo-notifications";
import { useRootNavigationState, useRouter, useSegments } from "expo-router";
import type { PropsWithChildren } from "react";
import { useCallback, useEffect, useRef } from "react";
import { InteractionManager } from "react-native";

import { markNotificationRead } from "@/features/notifications/services/notifications-service";
import { registerCurrentDeviceForPush } from "@/features/notifications/services/push-notifications-service";
import { resolveNotificationRoute } from "@/features/notifications/notification-routing";

import { useAuth } from "@/features/auth/session/auth-context";
import { InAppNotificationBanner } from "@/features/notifications/components/in-app-notification-banner";

export function PushNotificationsProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const { isReady, isAuthenticated, isEmailVerified, isOnboarded, userId } =
    useAuth();
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

  /**
   * Navigasyon ağacının kurulmuş olması yetmiyordu. Soğuk açılışta kök rota
   * app/index.tsx; o ekran başlangıç hedefini (oturum + ilk açılış durumu)
   * çözdüğünde kendini `router.replace` ile onunla değiştiriyor. Oturum durumu
   * genelde daha önce hazır olduğu için bildirim rotasını araya sıkıştırıyorduk
   * ve hemen ardından gelen replace yığının tepesindeki o rotayı siliyordu —
   * kullanıcı uygulamayı açıyor ama ana sayfada kalıyordu.
   *
   * index rotasının segmenti yok; başlangıç yönlendirmesi uygulanır uygulanmaz
   * ("(tabs)", "(auth)" ...) segment doluyor. Yani boş segment "henüz
   * yönlendirilmedi" demek: o ana kadar bekliyoruz.
   */
  const segments = useSegments();
  const startupRedirectApplied = segments.length > 0;

  const canNavigate =
    Boolean(navigationState?.key) &&
    isReady &&
    isAuthenticated &&
    isEmailVerified &&
    isOnboarded &&
    startupRedirectApplied;

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
      // getLastNotificationResponseAsync her açılışta (JS reload dahil) aynı
      // yanıtı döndürüyor; ref ise reload'da sıfırlanıyor. Temizlemezsek
      // kullanıcı her açılışta son dokunduğu bildirimin ekranına atılıyor.
      Notifications.clearLastNotificationResponse();

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
