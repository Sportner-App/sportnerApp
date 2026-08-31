import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, View } from "react-native";

import { themeColors } from "@/constants/theme";
import { hasUnreadNotifications } from "@/services/notifications-service";

import { BrandMark } from "./brand-mark";

export function TabScreenHeader() {
  const router = useRouter();
  const [hasUnread, setHasUnread] = useState(false);

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
      <BrandMark />
      <View className="flex-row items-center gap-2">
        <HeaderAction
          icon="comments"
          label="Sohbetlerim"
          onPress={() => router.push("/conversations")}
        />
        <HeaderAction
          icon="bell"
          label="Bildirimler"
          showIndicator={hasUnread}
          onPress={() => router.push("/notifications")}
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
}: {
  icon: "comments" | "bell";
  label: string;
  showIndicator?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={onPress}
      className="h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 active:opacity-70"
    >
      <FontAwesome6
        name={icon}
        size={17}
        color={themeColors.text.inverse}
      />
      {showIndicator ? (
        <View
          className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2"
          style={{
            backgroundColor: themeColors.brand.primary,
            borderColor: "#1c2416",
          }}
        />
      ) : null}
    </Pressable>
  );
}
