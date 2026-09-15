import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { resolveNotificationRoute } from "@/utils/notification-routing";
import { markNotificationRead } from "@/services/notifications-service";
import { listNotifications } from "@/services/notifications-service";

type BannerState = {
  id: string;
  notificationId: string | null;
  title: string;
  body: string;
  route: string;
};

const VISIBLE_DURATION_MS = 1800;
const HIDE_ANIMATION_MS = 180;

/**
 * A top-down banner for push notifications that arrive while the app is in the
 * foreground (the OS banner is suppressed - see configureForegroundNotifications) - WhatsApp's
 * in-app notification behavior: slides in, holds briefly, slides back out on its own.
 */
export function InAppNotificationBanner() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [banner, setBanner] = useState<BannerState | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seenInboxIds = useRef(new Set<string>());

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-16);

  useEffect(() => {
    const clearPendingTimeout = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const hide = (bannerId: string) => {
      clearPendingTimeout();
      opacity.value = withTiming(0, { duration: HIDE_ANIMATION_MS });
      translateY.value = withTiming(-16, { duration: HIDE_ANIMATION_MS });
      timeoutRef.current = setTimeout(() => {
        setBanner((prev) => (prev?.id === bannerId ? null : prev));
      }, HIDE_ANIMATION_MS + 20);
    };

    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        clearPendingTimeout();

        const id = notification.request.identifier;
        const { title, body, data } = notification.request.content;

        setBanner({
          id,
          notificationId:
            typeof data.notificationId === "string"
              ? data.notificationId
              : null,
          title: title ?? "",
          body: body ?? "",
          route: resolveNotificationRoute(data),
        });

        opacity.value = 0;
        translateY.value = -16;
        opacity.value = withTiming(1, { duration: 200 });
        translateY.value = withTiming(0, {
          duration: 220,
          easing: Easing.out(Easing.cubic),
        });

        timeoutRef.current = setTimeout(() => hide(id), VISIBLE_DURATION_MS);
      },
    );

    return () => {
      subscription.remove();
      clearPendingTimeout();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // In-app is a real delivery channel, not merely an inbox preference. Polling is a
  // lightweight fallback for users who intentionally disabled device push while the
  // app is open (and for simulators where Expo push is unavailable).
  useEffect(() => {
    let initialLoad = true;
    const syncInbox = async () => {
      const page = await listNotifications({ unreadOnly: true, limit: 1 });
      const item = page.items[0];
      if (!item) return;
      const isNew = seenInboxIds.current.has(item.id);
      seenInboxIds.current.add(item.id);
      if (initialLoad || isNew) return;
      setBanner({
        id: `inbox-${item.id}`,
        notificationId: item.id,
        title: item.title,
        body: item.body,
        route: resolveNotificationRoute(item),
      });
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withTiming(0, {
        duration: 220,
        easing: Easing.out(Easing.cubic),
      });
    };
    void syncInbox().finally(() => {
      initialLoad = false;
    });
    const interval = setInterval(
      () => void syncInbox().catch(() => undefined),
      30000,
    );
    return () => clearInterval(interval);
  }, []);

  const handlePress = () => {
    if (!banner) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    opacity.value = withTiming(0, { duration: HIDE_ANIMATION_MS });
    translateY.value = withTiming(-16, { duration: HIDE_ANIMATION_MS });
    router.push(banner.route as never);
    if (banner.notificationId) {
      void markNotificationRead(banner.notificationId).catch(() => undefined);
    }
    setTimeout(() => setBanner(null), HIDE_ANIMATION_MS);
  };

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!banner) return null;

  return (
    <View
      pointerEvents="box-none"
      className="absolute left-0 right-0 z-50"
      style={{ top: insets.top + 6 }}
    >
      <Animated.View
        style={[
          cardStyle,
          {
            shadowColor: "#000",
            shadowOpacity: 0.2,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 8,
          },
        ]}
        className="mx-4 overflow-hidden rounded-2xl border border-white/10 bg-brand-surface"
      >
        <Pressable
          onPress={handlePress}
          className="flex-row items-center gap-3 px-4 py-3.5 active:opacity-80"
        >
          <View className="h-9 w-9 items-center justify-center rounded-xl border border-brand-primary/30 bg-brand-primary/10">
            <FontAwesome6 name="bell" size={14} color="#ccff00" />
          </View>

          <View className="flex-1">
            {!!banner.title && (
              <Text
                numberOfLines={1}
                className="font-body text-sm font-semibold text-white"
              >
                {banner.title}
              </Text>
            )}
            {!!banner.body && (
              <Text
                numberOfLines={2}
                className="mt-0.5 font-body text-xs text-brand-neutral"
              >
                {banner.body}
              </Text>
            )}
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}
