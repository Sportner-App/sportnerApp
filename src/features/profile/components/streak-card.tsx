import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";

import { AppText as Text, BottomSheet } from "@/components";
import { themeColors } from "@/constants/theme";
import { useAuth, useToast } from "@/contexts";
import {
  getStreak,
  updateWeeklyGoal,
} from "@/features/profile/services/profile-service";
import type { Streak } from "@/features/profile/types";

const GOAL_OPTIONS = [1, 2, 3, 4, 5];

/**
 * Ana sayfadaki haftalık seri kartı: seri sayısı, bu haftanın hedef rozeti ve
 * son 8 haftanın şeridi. Rozete dokununca haftalık hedef seçiliyor.
 */
export function StreakCard() {
  const { t } = useTranslation("profile");
  const { user } = useAuth();
  const { showToast } = useToast();
  const [streak, setStreak] = useState<Streak | null>(null);
  const [goalSheetOpen, setGoalSheetOpen] = useState(false);
  const userId = user?.id;

  useFocusEffect(
    useCallback(() => {
      if (!userId) {
        setStreak(null);
        return;
      }
      void getStreak(userId)
        .then(setStreak)
        .catch(() => undefined);
    }, [userId]),
  );

  if (!streak) {
    return null;
  }

  const goalReached = streak.thisWeekCount >= streak.weeklyGoal;
  const isActive = streak.currentStreak > 0;

  const subtitle = goalReached
    ? t("streak.goalReached")
    : streak.thisWeekCount > 0
      ? t("streak.goalRemaining", {
          count: streak.weeklyGoal - streak.thisWeekCount,
        })
      : isActive
        ? t("streak.keepAlive")
        : t("streak.start");

  const selectGoal = async (goal: number) => {
    setGoalSheetOpen(false);
    if (goal === streak.weeklyGoal) return;
    const previous = streak;
    setStreak({ ...streak, weeklyGoal: goal });
    try {
      const updated = await updateWeeklyGoal(goal);
      if (updated) setStreak(updated);
      void Haptics.selectionAsync();
    } catch {
      setStreak(previous);
      showToast({ type: "error", title: t("streak.goalFailed") });
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(380)}
      className="gap-sm rounded-[22px] border border-border-default bg-surface-secondary p-md"
    >
      <View className="flex-row flex-wrap items-center justify-between gap-sm">
        <View className="flex-shrink flex-row items-center gap-2">
          <FontAwesome6
            name="fire"
            size={16}
            color={
              isActive ? themeColors.brand.primary : themeColors.text.tertiary
            }
          />
          <Text className="flex-shrink font-display text-heading-sm text-text-primary">
            {t("streak.weeks", { count: streak.currentStreak })}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("streak.goalTitle")}
          onPress={() => setGoalSheetOpen(true)}
          hitSlop={8}
          className={`flex-row items-center gap-1.5 rounded-full border px-3 py-1 active:opacity-70 ${
            goalReached
              ? "border-brand-primary bg-brand-primary/15"
              : "border-border-default"
          }`}
        >
          {goalReached ? (
            <Animated.View entering={ZoomIn.springify()}>
              <FontAwesome6
                name="check"
                size={11}
                color={themeColors.brand.primary}
              />
            </Animated.View>
          ) : null}
          <Text className="text-caption text-text-secondary">
            {t("streak.goalShort")}{" "}
            <Text className="font-body-bold text-caption text-text-primary">
              {streak.thisWeekCount}/{streak.weeklyGoal}
            </Text>
          </Text>
        </Pressable>
      </View>

      <Text className="text-caption text-text-secondary">{subtitle}</Text>

      <View
        className="mt-1 flex-row gap-1"
        accessibilityLabel={`${t("streak.weeksAgo", {
          count: streak.recentWeeks.length - 1,
        })} – ${t("streak.thisWeek")}`}
      >
        {streak.recentWeeks.map((week, index) => {
          const isCurrent = index === streak.recentWeeks.length - 1;
          return (
            <View
              key={week.weekStart}
              className={`h-1.5 flex-1 rounded-full ${
                week.count > 0
                  ? "bg-brand-primary"
                  : isCurrent
                    ? "bg-brand-primary/30"
                    : "bg-border-default"
              }`}
            />
          );
        })}
      </View>

      <BottomSheet
        visible={goalSheetOpen}
        onClose={() => setGoalSheetOpen(false)}
        title={t("streak.goalTitle")}
        subtitle={t("streak.goalSubtitle")}
      >
        <View className="flex-row gap-2">
          {GOAL_OPTIONS.map((goal) => {
            const selected = goal === streak.weeklyGoal;
            return (
              <Pressable
                key={goal}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => void selectGoal(goal)}
                className={`flex-1 items-center gap-1 rounded-2xl border py-4 active:opacity-70 ${
                  selected
                    ? "border-brand-primary bg-brand-primary/15"
                    : "border-border-default bg-surface-primary"
                }`}
              >
                <Text className="font-display text-heading-sm text-text-primary">
                  {goal}
                </Text>
                <Text className="text-overline text-text-tertiary">
                  {t("streak.perWeek")}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>
    </Animated.View>
  );
}
