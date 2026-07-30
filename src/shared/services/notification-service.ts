import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect } from "react";

import { updatePushToken } from "@/features/auth/api/auth-service";
import { useAuth } from "@/features/auth/model/auth-context";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  try {
    const existingStatus = await Notifications.getPermissionsAsync();
    let finalStatus = (existingStatus as any).status || existingStatus;

    if (finalStatus !== "granted") {
      const newStatus = await Notifications.requestPermissionsAsync();
      finalStatus = (newStatus as any).status || newStatus;
    }

    if (finalStatus !== "granted") {
      console.warn("Bildirim izni reddedildi");
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("projectId")) {
        console.warn(
          "Push notifications için EAS build gerekli. Expo Go'da desteklenmiyor.",
        );
      } else {
        console.error("Push token alınamadı:", error.message);
      }
    } else {
      console.error("Push token alınamadı:", error);
    }
    return null;
  }
}

export function useNotificationService() {
  const router = useRouter();
  const { userId, isReady } = useAuth();

  useEffect(() => {
    if (!isReady || !userId) {
      return;
    }

    // Push token'ı al ve backend'e gönder
    let isMounted = true;

    const setupPushToken = async () => {
      const token = await registerForPushNotificationsAsync();

      if (token && isMounted) {
        try {
          await updatePushToken(token);
          console.log("Push token backend'e gönderildi:", token);
        } catch (error) {
          console.error("Push token güncellemesi başarısız:", error);
        }
      }
    };

    void setupPushToken();

    // Bildirim geldiğinde dinle
    const notificationListener =
      Notifications.addNotificationResponseReceivedListener(
        (response: Notifications.NotificationResponse) => {
          const { eventId } = response.notification.request.content.data as {
            eventId?: string;
          };

          if (eventId) {
            // İlgili etkinlik detay ekranına yönlendir
            router.push(`/events/${eventId}`);
          }
        },
      );

    return () => {
      isMounted = false;
      notificationListener.remove();
    };
  }, [isReady, userId, router]);
}
