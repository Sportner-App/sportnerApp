import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { themeColors, typeStyles } from "@/constants/theme";
import type { EventDetail } from "@/types/events";

type AboutSectionProps = {
  event: EventDetail;
};

const EMPTY_DESCRIPTION = "Açıklama eklenmemiş.";
const COLLAPSED_LINES = 4;

export function AboutSection({ event }: AboutSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const description = event.description.trim();
  const isEmpty = description.length === 0 || description === EMPTY_DESCRIPTION;
  const isLong = !isEmpty && description.length > 180;

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(160)} className="gap-md">
      <Text style={[typeStyles.label, { color: themeColors.text.secondary }]}>
        Etkinlik Hakkında
      </Text>

      {isEmpty ? (
        <Text
          className="font-body text-[15px] leading-6"
          style={{ color: themeColors.text.secondary }}
        >
          {EMPTY_DESCRIPTION}
        </Text>
      ) : (
        <View className="gap-sm">
          <Text
            numberOfLines={expanded || !isLong ? undefined : COLLAPSED_LINES}
            className="font-body text-[15px] leading-6"
            style={{ color: themeColors.text.primary }}
          >
            {description}
          </Text>
          {isLong ? (
            <Pressable onPress={() => setExpanded((value) => !value)} hitSlop={8}>
              <Text
                className="font-body-bold text-[13px]"
                style={{ color: themeColors.text.secondary }}
              >
                {expanded ? "Daha az göster" : "Daha fazla göster"}
              </Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </Animated.View>
  );
}
