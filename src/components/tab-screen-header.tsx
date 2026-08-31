import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";

import { themeColors } from "@/constants/theme";
import { BrandMark } from "./brand-mark";

export function TabScreenHeader() {
  const router = useRouter();

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
          showIndicator
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
        <View className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-background-primary bg-[#ff6b35]" />
      ) : null}
    </Pressable>
  );
}
