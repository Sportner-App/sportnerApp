import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, View } from "react-native";

import { AppText as Text } from "@/components";
import { themeColors } from "@/constants/theme";
import { listChallengeMedals } from "@/features/challenges/services/challenges-service";
import type { Challenge } from "@/features/challenges/types";
import type { IconName } from "@/types/components";

/** Profildeki madalya rafı: tamamlanan challenge'lar. Hiç yoksa görünmez. */
export function ChallengeMedals({
  userId,
  linkToChallenges = false,
}: {
  userId: string;
  linkToChallenges?: boolean;
}) {
  const { t } = useTranslation("badges");
  const router = useRouter();
  const [medals, setMedals] = useState<Challenge[]>([]);

  useFocusEffect(
    useCallback(() => {
      void listChallengeMedals(userId)
        .then(setMedals)
        .catch(() => undefined);
    }, [userId]),
  );

  if (medals.length === 0) {
    return null;
  }

  return (
    <View className="gap-2">
      <Text className="font-body-bold text-body-sm text-text-secondary">
        {t("challenges.medalsTitle", { count: medals.length })}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10 }}
      >
        {medals.map((medal) => (
          <Pressable
            key={medal.id}
            disabled={!linkToChallenges}
            onPress={() => router.push("/challenges")}
            className="w-24 items-center gap-1.5 rounded-2xl border border-border-default bg-surface-secondary px-2 py-3"
          >
            <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-primary">
              <FontAwesome6
                name={medal.icon as IconName}
                size={17}
                color={themeColors.background.primary}
              />
            </View>
            <Text
              numberOfLines={2}
              className="text-center font-body-bold text-overline text-text-primary"
            >
              {medal.title}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
