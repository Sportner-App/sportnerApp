import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { AppScreen, AppText as Text, ScreenHeader } from "@/components";
import { shadows, themeColors } from "@/constants/theme";
import { ChallengeHomeCard } from "@/features/challenges/components/challenge-home-card";
import { LeaderboardHomeCard } from "@/features/leaderboards/components/leaderboard-home-card";
import { StreakCard } from "@/features/profile/components/streak-card";
import { yearlyRevealYear } from "@/features/recaps/format";

/** Seri, challenge'lar, semt sırası ve aylık özet tek yerde; ana sayfadaki şerit buraya açılır. */
export function ProgressScreen() {
  const { t } = useTranslation("home");
  const { t: tRecap } = useTranslation("recap");
  const router = useRouter();
  const revealYear = yearlyRevealYear();

  return (
    <AppScreen
      header={<ScreenHeader title={t("progress.title")} showBack />}
      contentClassName="gap-md px-6 pt-3"
    >
      {revealYear !== null ? (
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push({ pathname: "/recap/year", params: { year: String(revealYear) } })
          }
          className="flex-row items-center gap-md rounded-[22px] border border-brand-primary/40 bg-brand-primary/10 p-md active:opacity-80"
        >
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-brand-primary/20">
            <FontAwesome6 name="star" solid size={17} color={themeColors.brand.primary} />
          </View>
          <View className="flex-1 gap-0.5">
            <Text className="font-body-bold text-body text-text-primary">
              {tRecap("year.entry.title", { year: revealYear })}
            </Text>
            <Text numberOfLines={2} className="text-caption text-text-secondary">
              {tRecap("year.entry.body")}
            </Text>
          </View>
          <FontAwesome6 name="chevron-right" size={12} color={themeColors.text.tertiary} />
        </Pressable>
      ) : null}
      <StreakCard />
      <ChallengeHomeCard />
      <LeaderboardHomeCard />
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/recap")}
        className="flex-row items-center gap-md rounded-[22px] border border-border-default bg-surface-secondary p-md active:opacity-80"
        style={shadows.md}
      >
        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-brand-primary/15">
          <FontAwesome6 name="chart-simple" size={17} color={themeColors.brand.primary} />
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="font-body-bold text-body text-text-primary">
            {t("progress.recapRow.title")}
          </Text>
          <Text numberOfLines={2} className="text-caption text-text-secondary">
            {t("progress.recapRow.body")}
          </Text>
        </View>
        <FontAwesome6 name="chevron-right" size={12} color={themeColors.text.tertiary} />
      </Pressable>
    </AppScreen>
  );
}
