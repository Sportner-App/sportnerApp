import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, Text, View } from "react-native";

import { themeColors } from "@/constants/theme";
import type { IconName } from "@/types/components";

/** Tappable icon + title/subtitle row with an optional badge, used for event-detail inbox-style entries (waitlist, attendance, reviews). */
export function InboxRow({
  title,
  subtitle,
  icon,
  badge,
  accentBackground,
  accentColor,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: IconName;
  badge?: number;
  accentBackground?: string;
  accentColor?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-large py-2.5 active:opacity-80"
    >
      <View
        className="h-10 w-10 items-center justify-center rounded-full"
        style={{
          backgroundColor: accentBackground ?? themeColors.surface.secondary,
        }}
      >
        <FontAwesome6
          name={icon}
          size={14}
          color={accentColor ?? themeColors.text.secondary}
        />
      </View>

      <View className="flex-1">
        <Text
          className="font-body-bold text-sm"
          style={{ color: themeColors.text.primary }}
        >
          {title}
        </Text>
        <Text
          className="font-body text-caption"
          style={{ color: themeColors.text.secondary }}
        >
          {subtitle}
        </Text>
      </View>

      {badge != null ? (
        <View
          className="min-w-[22px] items-center rounded-full px-1.5 py-0.5"
          style={{ backgroundColor: themeColors.brand.primary }}
        >
          <Text
            className="font-body-bold text-[11px]"
            style={{ color: themeColors.text.onPrimary }}
          >
            {badge}
          </Text>
        </View>
      ) : null}

      <FontAwesome6
        name="chevron-right"
        size={12}
        color={themeColors.text.tertiary}
      />
    </Pressable>
  );
}
