import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { resolveNotificationRoute } from "@/utils/notification-routing";
import { markNotificationRead } from "@/services/notifications-service";
import { listNotifications } from "@/services/notifications-service";
import { AppText as Text } from "@/components/app-text";

type BannerState = {
  id: string;
  notificationId: string | null;
  title: string;
  body: string;
  route: string;
};

const VISIBLE_DURATION_MS = 1800;
const HIDE_ANIMATION_MS = 180;
const SWIPE_DISMISS_DISTANCE = -24;
const SWIPE_DISMISS_VELOCITY = -600;

/**
 * A top-down banner for push notifications that arrive while the app is in the
 * foreground (the OS banner is suppressed - see configureForegroundNotifications) - WhatsApp's
 * in-app notification behavior: slides in, holds briefly, slides back out on its own,
 * and can be swiped up to dismiss early.
 */
export function InAppNotificationBanner() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [banner, setBanner] = useState<BannerState | null>(null);
  const bannerRef = useRef<BannerState | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seenInboxIds = useRef(new Set<string>());

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-16);
  const dragY = useSharedValue(0);

  useEffect(() => {
    bannerRef.current = banner;
  }, [banner]);

  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const dismissBanner = useCallback((bannerId: string) => {
    setBanner((prev) => (prev?.id === bannerId ? null : prev));
  }, []);

  const hide = useCallback(
    (bannerId: string) => {
      clearPendingTimeout();
      opacity.value = withTiming(0, { duration: HIDE_ANIMATION_MS });
      translateY.value = withTiming(-16, { duration: HIDE_ANIMATION_MS });
      dragY.value = withTiming(0, { duration: HIDE_ANIMATION_MS });
      timeoutRef.current = setTimeout(() => {
        dismissBanner(bannerId);
      }, HIDE_ANIMATION_MS + 20);
    },
    [clearPendingTimeout, dismissBanner, dragY, opacity, translateY],
  );

  // Every path that shows a banner (push listener, inbox-poll fallback) must go
  // through this so the auto-hide timer is always armed - previously the inbox
  // path set the banner directly and it never scheduled a hide, so it stuck.
  const scheduleAutoHide = useCallback(
    (bannerId: string) => {
      clearPendingTimeout();
      timeoutRef.current = setTimeout(
        () => hide(bannerId),
        VISIBLE_DURATION_MS,
      );
    },
    [clearPendingTimeout, hide],
  );

  const showBanner = useCallback(
    (next: BannerState) => {
      clearPendingTimeout();
      dragY.value = 0;
      opacity.value = 0;
      translateY.value = -16;
      setBanner(next);
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withTiming(0, {
        duration: 220,
        easing: Easing.out(Easing.cubic),
      });
      scheduleAutoHide(next.id);
    },
    [clearPendingTimeout, dragY, opacity, scheduleAutoHide, translateY],
  );

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        const id = notification.request.identifier;
        const { title, body, data } = notification.request.content;

        showBanner({
          id,
          notificationId:
            typeof data.notificationId === "string"
              ? data.notificationId
              : null,
          title: title ?? "",
          body: body ?? "",
          route: resolveNotificationRoute(data),
        });
      },
    );

    return () => subscription.remove();
  }, [showBanner]);

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
      showBanner({
        id: `inbox-${item.id}`,
        notificationId: item.id,
        title: item.title,
        body: item.body,
        route: resolveNotificationRoute(item),
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
  }, [showBanner]);

  useEffect(() => () => clearPendingTimeout(), [clearPendingTimeout]);

  const handlePress = () => {
    if (!banner) return;
    const { id, route, notificationId } = banner;
    hide(id);
    router.push(route as never);
    if (notificationId) {
      void markNotificationRead(notificationId).catch(() => undefined);
    }
  };

  const resumeAutoHide = useCallback(() => {
    if (bannerRef.current) scheduleAutoHide(bannerRef.current.id);
  }, [scheduleAutoHide]);

  const dismissFromGesture = useCallback(() => {
    if (bannerRef.current) dismissBanner(bannerRef.current.id);
  }, [dismissBanner]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-8, 8])
        .onStart(() => {
          scheduleOnRN(clearPendingTimeout);
        })
        .onUpdate((event) => {
          dragY.value = Math.min(0, event.translationY);
        })
        .onEnd((event) => {
          const shouldDismiss =
            dragY.value < SWIPE_DISMISS_DISTANCE ||
            event.velocityY < SWIPE_DISMISS_VELOCITY;

          if (shouldDismiss) {
            opacity.value = withTiming(0, { duration: HIDE_ANIMATION_MS });
            translateY.value = withTiming(
              -80,
              { duration: HIDE_ANIMATION_MS },
              (finished) => {
                if (finished) scheduleOnRN(dismissFromGesture);
              },
            );
            return;
          }

          dragY.value = withSpring(0, { dampingRatio: 0.8, duration: 260 });
          scheduleOnRN(resumeAutoHide);
        }),
    [
      clearPendingTimeout,
      dismissFromGesture,
      dragY,
      opacity,
      resumeAutoHide,
      translateY,
    ],
  );

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value + dragY.value }],
  }));

  if (!banner) return null;

  return (
    <View
      pointerEvents="box-none"
      className="absolute left-0 right-0 z-50"
      style={{ top: insets.top + 6 }}
    >
      <GestureDetector gesture={panGesture}>
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
                  className="font-body text-body-sm font-semibold text-white"
                >
                  {banner.title}
                </Text>
              )}
              {!!banner.body && (
                <Text
                  numberOfLines={2}
                  className="mt-0.5 font-body text-caption text-brand-neutral"
                >
                  {banner.body}
                </Text>
              )}
            </View>
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
