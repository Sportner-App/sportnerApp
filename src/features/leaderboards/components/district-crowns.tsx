import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { AppText as Text } from "@/components";
import { themeColors } from "@/constants/theme";
import { listDistrictCrowns } from "@/features/leaderboards/services/leaderboards-service";
import type { DistrictCrown } from "@/features/leaderboards/types";
import { getCurrentLocale } from "@/i18n";

/** Profilde kazanılan semt taçları ("Kasım · Maltepe"). Hiç yoksa görünmez. */
export function DistrictCrowns({ userId }: { userId: string }) {
  const { t } = useTranslation("leaderboards");
  const [crowns, setCrowns] = useState<DistrictCrown[]>([]);

  useFocusEffect(
    useCallback(() => {
      void listDistrictCrowns(userId)
        .then(setCrowns)
        .catch(() => undefined);
    }, [userId]),
  );

  if (crowns.length === 0) {
    return null;
  }

  const monthFormat = new Intl.DateTimeFormat(getCurrentLocale(), {
    month: "long",
    year: "numeric",
  });

  return (
    <View className="gap-2">
      <Text className="font-body-bold text-body-sm text-text-secondary">
        {t("crowns.title", { count: crowns.length })}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {crowns.map((crown) => (
          <View
            key={`${crown.month}-${crown.city}-${crown.district}`}
            className="flex-row items-center gap-1.5 rounded-full bg-brand-primary/15 px-3 py-1.5"
          >
            <FontAwesome6 name="crown" size={11} color={themeColors.brand.primary} />
            <Text className="font-body-bold text-caption text-text-primary">
              {t("crowns.label", {
                month: monthFormat.format(new Date(`${crown.month}T12:00:00`)),
                district: crown.district,
              })}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
