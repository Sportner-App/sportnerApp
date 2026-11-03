import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { AppText as Text } from "@/components";
import { shadows, themeColors } from "@/constants/theme";
import { useAuth } from "@/contexts";
import { getMyDistrictStanding } from "@/features/leaderboards/services/leaderboards-service";
import type { MyDistrictStanding } from "@/features/leaderboards/types";

/** Ana sayfada kullanıcının semtindeki bu ayki sırası; dokununca sıralama açılır. */
export function LeaderboardHomeCard() {
  const { t } = useTranslation("leaderboards");
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [standing, setStanding] = useState<MyDistrictStanding | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) {
        setStanding(null);
        return;
      }
      void getMyDistrictStanding()
        .then(setStanding)
        .catch(() => undefined);
    }, [isAuthenticated]),
  );

  if (!standing) {
    return null;
  }

  const subtitle =
    standing.rank === 1
      ? t("home.leader", { total: standing.totalPlayers })
      : standing.rank
        ? t("home.ranked", { rank: standing.rank, total: standing.totalPlayers })
        : t("home.unranked");

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        router.push({
          pathname: "/leaderboards",
          params: { city: standing.city, district: standing.district },
        })
      }
      className="flex-row items-center gap-md rounded-[22px] border border-border-default bg-surface-secondary p-md active:opacity-80"
      style={shadows.md}
    >
      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-brand-primary/15">
        <FontAwesome6 name="crown" size={17} color={themeColors.brand.primary} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text numberOfLines={1} className="font-body-bold text-body text-text-primary">
          {t("home.title", { district: standing.district })}
        </Text>
        <Text numberOfLines={2} className="text-caption text-text-secondary">
          {subtitle}
        </Text>
      </View>
      <FontAwesome6 name="chevron-right" size={12} color={themeColors.text.tertiary} />
    </Pressable>
  );
}
