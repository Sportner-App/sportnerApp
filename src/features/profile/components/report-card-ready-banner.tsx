import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { AppText as Text } from "@/components";
import { palette, themeColors } from "@/constants/theme";
import { getSportReportCard } from "@/features/profile/services/profile-service";

type ReportCardReadyBannerProps = {
  userId: string;
};

/**
 * Kendi profilinde, karne dolduğunda (en az bir etkinlik) çıkan davet.
 * Karnenin kendisi ayrı ekranda; profil açılışını kaplamasın diye.
 */
export function ReportCardReadyBanner({ userId }: ReportCardReadyBannerProps) {
  const { t } = useTranslation("profile");
  const router = useRouter();
  const [year, setYear] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      void getSportReportCard(userId)
        .then((card) =>
          setYear(card && card.eventsPlayed > 0 ? card.year : null),
        )
        .catch(() => undefined);
    }, [userId]),
  );

  if (year === null) {
    return null;
  }

  return (
    <Animated.View entering={FadeInDown.duration(360)}>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/profile/report-card")}
        className="flex-row items-center gap-3 rounded-[22px] border border-brand-primary/30 bg-brand-primary/10 p-4 active:opacity-80"
      >
        <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-primary">
          <FontAwesome6 name="chart-simple" size={15} color={palette.canvas} />
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="font-body-bold text-body-sm text-text-primary">
            {t("reportCard.readyTitle", { year })}
          </Text>
          <Text className="text-caption text-text-secondary">
            {t("reportCard.readyBody")}
          </Text>
        </View>
        <FontAwesome6
          name="chevron-right"
          size={13}
          color={themeColors.text.secondary}
        />
      </Pressable>
    </Animated.View>
  );
}
