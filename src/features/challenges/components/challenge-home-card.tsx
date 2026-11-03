import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { AppText as Text } from "@/components";
import { HIT_SLOP, shadows, themeColors } from "@/constants/theme";
import { ChallengeItem } from "@/features/challenges/components/challenge-item";
import { useChallenges } from "@/features/challenges/hooks/use-challenges";

/** Ana sayfada bu ayın challenge'ları: doğrudan katılınabiliyor. */
export function ChallengeHomeCard() {
  const { t } = useTranslation("badges");
  const router = useRouter();
  const { challenges, busyId, join } = useChallenges();

  if (challenges.length === 0) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(380)}
      className="gap-md rounded-[22px] border border-border-default bg-surface-secondary p-md"
      style={shadows.md}
    >
      <View className="flex-row items-center justify-between">
        <Text className="font-display text-heading-sm text-text-primary">
          {t("challenges.homeTitle")}
        </Text>
        <Pressable
          accessibilityRole="button"
          hitSlop={HIT_SLOP}
          onPress={() => router.push("/challenges")}
          className="flex-row items-center gap-1 active:opacity-70"
        >
          <Text className="font-body-bold text-caption text-brand-primary">
            {t("challenges.seeAll")}
          </Text>
          <FontAwesome6
            name="chevron-right"
            size={10}
            color={themeColors.brand.primary}
          />
        </Pressable>
      </View>

      {challenges.map((challenge) => (
        <ChallengeItem
          key={challenge.id}
          challenge={challenge}
          compact
          busy={busyId === challenge.id}
          onJoin={() => void join(challenge.id)}
        />
      ))}
    </Animated.View>
  );
}
