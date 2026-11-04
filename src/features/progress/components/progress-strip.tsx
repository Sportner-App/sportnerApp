import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { AppText as Text } from "@/components";
import { HIT_SLOP, themeColors } from "@/constants/theme";
import { STORAGE_KEYS } from "@/constants/storage-keys";
import { useAuth } from "@/contexts";
import { listChallenges } from "@/features/challenges/services/challenges-service";
import type { Challenge } from "@/features/challenges/types";
import { getMyDistrictStanding } from "@/features/leaderboards/services/leaderboards-service";
import type { MyDistrictStanding } from "@/features/leaderboards/types";
import { getStreak } from "@/features/profile/services/profile-service";
import { formatRecapMonth, RECAP_READY_DAY } from "@/features/recaps/format";
import { getMonthlyRecap } from "@/features/recaps/services/recaps-service";
import type { MonthlyRecap } from "@/features/recaps/types";
import type { Streak } from "@/features/profile/types";

type Nudge = "streak" | "recap" | "challenge";

/** Geçen ayın özeti ayın 3–7'si arasında öne çıkarılıyor (bildirimle aynı pencere). */
const RECAP_NUDGE_LAST_DAY = 7;

const ISTANBUL_OFFSET_MS = 3 * 60 * 60 * 1000;

function istanbulNow() {
  return new Date(Date.now() + ISTANBUL_OFFSET_MS);
}

/** Bugünün İstanbul tarihi; kapatılan uyarı o gün bir daha çıkmasın diye. */
function todayKey() {
  return istanbulNow().toISOString().slice(0, 10);
}

/**
 * Ana sayfada seri, challenge ve semt sırasını tek satırlık chip'lere indiren
 * şerit. Yapılacak bir şey olduğunda (seri tehlikede, katılınmamış challenge)
 * altına tek bir uyarı kartı ekleniyor; chip'ler İlerleme ekranının yolu olduğu
 * için kart varken de duruyor.
 */
export function ProgressStrip() {
  const { t } = useTranslation("home");
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;
  const [streak, setStreak] = useState<Streak | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [standing, setStanding] = useState<MyDistrictStanding | null>(null);
  const [recap, setRecap] = useState<MonthlyRecap | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.dismissedProgressNudge)
      .then(setDismissed)
      .catch(() => undefined);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!userId) {
        setStreak(null);
        setChallenges([]);
        setStanding(null);
        setRecap(null);
        return;
      }
      const day = istanbulNow().getUTCDate();
      if (day >= RECAP_READY_DAY && day <= RECAP_NUDGE_LAST_DAY) {
        void getMonthlyRecap().then(setRecap).catch(() => undefined);
      }
      void getStreak(userId).then(setStreak).catch(() => undefined);
      void listChallenges().then(setChallenges).catch(() => undefined);
      void getMyDistrictStanding().then(setStanding).catch(() => undefined);
    }, [userId]),
  );

  if (!streak && challenges.length === 0 && !standing) {
    return null;
  }

  const day = istanbulNow().getUTCDay();
  const lateInWeek = day === 0 || day >= 4;
  const nudge: Nudge | null =
    dismissed === todayKey()
      ? null
      : streak && streak.currentStreak > 0 && streak.thisWeekCount === 0 && lateInWeek
        ? "streak"
        : recap?.isReady
          ? "recap"
          : challenges.length > 0 && !challenges.some((c) => c.isJoined)
          ? "challenge"
          : null;

  const openProgress = () => router.push("/progress");
  const openNudge = () =>
    nudge === "recap" ? router.push("/recap") : openProgress();

  const dismiss = () => {
    const key = todayKey();
    setDismissed(key);
    void AsyncStorage.setItem(STORAGE_KEYS.dismissedProgressNudge, key).catch(
      () => undefined,
    );
  };

  const renderNudge = () => {
    if (!nudge) return null;
    const copy = {
      streak: {
        icon: "fire" as const,
        title: t("progress.nudge.streakTitle"),
        body: t("progress.nudge.streakBody", { count: streak?.currentStreak ?? 0 }),
      },
      recap: {
        icon: "chart-simple" as const,
        title: t("progress.nudge.recapTitle", {
          month: recap ? formatRecapMonth(recap.month, false) : "",
        }),
        body: t("progress.nudge.recapBody"),
      },
      challenge: {
        icon: "medal" as const,
        title: t("progress.nudge.challengeTitle"),
        body: t("progress.nudge.challengeBody"),
      },
    }[nudge];
    return (
      <Animated.View
        entering={FadeIn.duration(260)}
        className="flex-row items-center gap-md rounded-[22px] border border-brand-primary/40 bg-brand-primary/10 p-md"
      >
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-brand-primary/20">
          <FontAwesome6
            name={copy.icon}
            size={16}
            color={themeColors.brand.primary}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={openNudge}
          className="flex-1 gap-0.5 active:opacity-70"
        >
          <Text className="font-body-bold text-body text-text-primary">
            {copy.title}
          </Text>
          <Text numberOfLines={2} className="text-caption text-text-secondary">
            {copy.body}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("progress.nudge.dismiss")}
          hitSlop={HIT_SLOP}
          onPress={dismiss}
          className="self-start active:opacity-60"
        >
          <FontAwesome6 name="xmark" size={13} color={themeColors.text.tertiary} />
        </Pressable>
      </Animated.View>
    );
  };

  const joined = challenges.filter((c) => c.isJoined).length;

  return (
    <View className="gap-3">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2"
      >
        {streak ? (
          <Chip
            icon="fire"
            active={streak.currentStreak > 0}
            label={`${t("progress.streakChip", { count: streak.currentStreak })} · ${streak.thisWeekCount}/${streak.weeklyGoal}`}
            onPress={openProgress}
          />
        ) : null}
        {challenges.length > 0 ? (
          <Chip
            icon="medal"
            active={joined > 0}
            label={t("progress.challengesChip", { count: challenges.length })}
            onPress={openProgress}
          />
        ) : null}
        {standing ? (
          <Chip
            icon="crown"
            active={standing.rank === 1}
            label={
              standing.rank
                ? t("progress.rankChip", { district: standing.district, rank: standing.rank })
                : t("progress.rankChipUnranked", { district: standing.district })
            }
            onPress={openProgress}
          />
        ) : null}
      </ScrollView>
      {renderNudge()}
    </View>
  );
}

function Chip({
  icon,
  label,
  active,
  onPress,
}: {
  icon: "fire" | "medal" | "crown";
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="flex-row items-center gap-1.5 rounded-full border border-border-default bg-surface-secondary px-3 py-2 active:opacity-70"
    >
      <FontAwesome6
        name={icon}
        size={12}
        color={active ? themeColors.brand.primary : themeColors.text.tertiary}
      />
      <Text className="font-body-bold text-caption text-text-primary">{label}</Text>
    </Pressable>
  );
}
