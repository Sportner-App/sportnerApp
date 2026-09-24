import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Pressable,
  View,
  useWindowDimensions,
  type View as ViewType,
} from "react-native";
import { useTranslation } from "react-i18next";

import { themeColors } from "@/constants/theme";
import { useAppTour } from "@/contexts";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { hasUnreadConversations } from "@/services/messaging-service";
import { hasUnreadNotifications } from "@/services/notifications-service";
import { BrandMark } from "./brand-mark";

const HEADER_MIN_WIDTH = 390;
const HEADER_MAX_WIDTH = 430;

function responsiveSize(width: number, min: number, max: number): number {
  const progress = Math.max(
    0,
    Math.min(
      1,
      (width - HEADER_MIN_WIDTH) / (HEADER_MAX_WIDTH - HEADER_MIN_WIDTH),
    ),
  );
  return min + (max - min) * progress;
}

export function TabScreenHeader() {
  const { t } = useTranslation("components");
  const { width } = useWindowDimensions();
  const actionSize = responsiveSize(width, 40, 44);
  const actionIconSize = responsiveSize(width, 16, 18);
  const actionGap = responsiveSize(width, 6, 8);
  const indicatorSize = responsiveSize(width, 8, 10);
  const brandIconSize = responsiveSize(width, 34, 40);
  const brandTextSize = responsiveSize(width, 16, 18);
  const brandLetterSpacing = responsiveSize(width, 5, 7);
  const brandGap = responsiveSize(width, 6, 8);
  const router = useRouter();
  const [hasUnreadConversationMessages, setHasUnreadConversationMessages] =
    useState(false);
  const [hasUnreadNotificationItems, setHasUnreadNotificationItems] =
    useState(false);
  const { registerTarget } = useAppTour();
  const { requireAuth } = useRequireAuth();

  useFocusEffect(
    useCallback(() => {
      let active = true;

      void hasUnreadConversations()
        .then((unread) => {
          if (active) {
            setHasUnreadConversationMessages(unread);
          }
        })
        .catch(() => {
          if (active) {
            setHasUnreadConversationMessages(false);
          }
        });

      void hasUnreadNotifications()
        .then((unread) => {
          if (active) {
            setHasUnreadNotificationItems(unread);
          }
        })
        .catch(() => {
          if (active) {
            setHasUnreadNotificationItems(false);
          }
        });

      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <View className="flex-row items-center justify-between gap-2 py-2">
      <BrandMark
        tone="light"
        className="min-w-0 flex-1"
        iconSize={brandIconSize}
        textSize={brandTextSize}
        letterSpacing={brandLetterSpacing}
        gap={brandGap}
      />
      <View
        className="flex-row flex-shrink-0 items-center"
        style={{ gap: actionGap }}
      >
        <HeaderAction
          icon="magnifying-glass"
          size={actionSize}
          iconSize={actionIconSize}
          indicatorSize={indicatorSize}
          label={t("tabHeader.search")}
          onPress={() =>
            requireAuth(t("tabHeader.searchAuthRequired")) &&
            router.push("/people")
          }
        />
        <HeaderAction
          icon="comments"
          size={actionSize}
          iconSize={actionIconSize}
          indicatorSize={indicatorSize}
          label={t("tabHeader.conversations")}
          tourTargetRef={registerTarget("conversations")}
          showIndicator={hasUnreadConversationMessages}
          onPress={() =>
            requireAuth(t("tabHeader.conversationsAuthRequired")) &&
            router.push("/conversations")
          }
        />
        <HeaderAction
          icon="bell"
          size={actionSize}
          iconSize={actionIconSize}
          indicatorSize={indicatorSize}
          label={t("tabHeader.notifications")}
          showIndicator={hasUnreadNotificationItems}
          onPress={() =>
            requireAuth(t("tabHeader.notificationsAuthRequired")) &&
            router.push("/notifications")
          }
        />
      </View>
    </View>
  );
}

function HeaderAction({
  icon,
  label,
  showIndicator = false,
  onPress,
  tourTargetRef,
  size,
  iconSize,
  indicatorSize,
}: {
  icon: "magnifying-glass" | "comments" | "bell";
  label: string;
  showIndicator?: boolean;
  onPress: () => void;
  tourTargetRef?: (node: ViewType | null) => void;
  size: number;
  iconSize: number;
  indicatorSize: number;
}) {
  return (
    <View ref={tourTargetRef} collapsable={false}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        hitSlop={6}
        onPress={onPress}
        className="items-center justify-center rounded-full border border-border-default bg-surface-primary active:opacity-70"
        style={{ width: size, height: size }}
      >
        <FontAwesome6
          name={icon}
          size={iconSize}
          color={themeColors.text.primary}
        />
        {showIndicator ? (
          <View
            className="absolute rounded-full border-2 border-background-primary bg-brand-primary"
            style={{
              width: indicatorSize,
              height: indicatorSize,
              right: size * 0.16,
              top: size * 0.16,
            }}
          />
        ) : null}
      </Pressable>
    </View>
  );
}
