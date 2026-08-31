import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, View, type View as ViewType } from "react-native";

import { themeColors } from "@/constants/theme";
import { useAppTour } from "@/contexts";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { hasUnreadNotifications } from "@/services/notifications-service";
import { BrandMark } from "./brand-mark";

export function TabScreenHeader() {
  const router = useRouter();
  const [hasUnread, setHasUnread] = useState(false);
  const { registerTarget } = useAppTour();
  const { requireAuth } = useRequireAuth();

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void hasUnreadNotifications()
        .then((unread) => {
          if (active) {
            setHasUnread(unread);
          }
        })
        .catch(() => {
          if (active) {
            setHasUnread(false);
          }
        });

      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <View className="flex-row items-center justify-between py-2">
      <BrandMark tone="light" />
      <View className="flex-row items-center gap-2">
        <HeaderAction
          icon="comments"
          label="Sohbetlerim"
          tourTargetRef={registerTarget("conversations")}
          onPress={() =>
            requireAuth("Sohbetlerini görmek için giriş yapmalısın.") &&
            router.push("/conversations")
          }
        />
        <HeaderAction
          icon="bell"
          label="Bildirimler"
          showIndicator={hasUnread}
          onPress={() =>
            requireAuth("Bildirimlerini görmek için giriş yapmalısın.") &&
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
}: {
  icon: "comments" | "bell";
  label: string;
  showIndicator?: boolean;
  onPress: () => void;
  tourTargetRef?: (node: ViewType | null) => void;
}) {
  return (
    <View ref={tourTargetRef} collapsable={false}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        hitSlop={6}
        onPress={onPress}
        className="h-11 w-11 items-center justify-center rounded-full border border-border-default bg-surface-primary active:opacity-70"
      >
        <FontAwesome6 name={icon} size={17} color={themeColors.text.primary} />
        {showIndicator ? (
          <View className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-background-primary bg-brand-primary" />
        ) : null}
      </Pressable>
    </View>
  );
}
