import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import ViewShot, { captureRef } from "react-native-view-shot";

import {
  AppScreen,
  Button,
  AppText as Text,
  ScreenHeader,
  ScreenLoader,
} from "@/components";
import { HIT_SLOP, themeColors } from "@/constants/theme";
import { useAuth, useToast } from "@/contexts";
import { RecapPoster } from "@/features/recaps/components/recap-poster";
import {
  currentIstanbulMonth,
  formatRecapMonth,
  shiftMonth,
} from "@/features/recaps/format";
import { getMonthlyRecap } from "@/features/recaps/services/recaps-service";
import type { MonthlyRecap } from "@/features/recaps/types";

/** Aylık özet: ay seçici, poster ve hikâye olarak paylaşma. */
export function MonthlyRecapScreen() {
  const { t } = useTranslation("recap");
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const params = useLocalSearchParams<{ month?: string }>();
  const current = currentIstanbulMonth();
  const [month, setMonth] = useState(params.month ?? shiftMonth(current, -1));
  const [recap, setRecap] = useState<MonthlyRecap | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [sharing, setSharing] = useState(false);
  const storyRef = useRef<View>(null);
  const name = user?.fullName || user?.username || "";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    getMonthlyRecap(month)
      .then((value) => {
        if (!cancelled) setRecap(value);
      })
      .catch(() => {
        if (cancelled) return;
        setRecap(null);
        setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [month, attempt]);

  const share = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        throw new Error(t("shareUnavailable"));
      }
      const uri = await captureRef(storyRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
        width: 1080,
        height: 1920,
      });
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        UTI: "public.png",
        dialogTitle: t("share"),
      });
    } catch (error) {
      showToast({
        type: "error",
        title: t("shareFailed"),
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSharing(false);
    }
  };

  const canGoNext = month < current;

  return (
    <AppScreen
      header={<ScreenHeader title={t("title")} showBack />}
      contentClassName="gap-md px-6 pt-3"
    >
      <View className="flex-row items-center justify-between">
        <MonthArrow icon="chevron-left" label={t("previous")} onPress={() => setMonth(shiftMonth(month, -1))} />
        <Text className="font-display text-heading-sm capitalize text-text-primary">
          {formatRecapMonth(month)}
        </Text>
        <MonthArrow
          icon="chevron-right"
          label={t("next")}
          disabled={!canGoNext}
          onPress={() => setMonth(shiftMonth(month, 1))}
        />
      </View>

      {loading ? (
        <ScreenLoader label={t("loading")} />
      ) : recap?.isReady ? (
        <Animated.View key={month} entering={FadeIn.duration(300)} className="gap-md">
          <RecapPoster recap={recap} name={name} animated />
          <Button
            label={t("share")}
            icon="arrow-up-from-bracket"
            onPress={() => void share()}
            isLoading={sharing}
          />
          {month === current ? (
            <Text className="text-center text-caption text-text-tertiary">{t("inProgress")}</Text>
          ) : null}

          <View pointerEvents="none" className="absolute -left-[5000px] top-0">
            <ViewShot ref={storyRef} options={{ format: "png" }}>
              <RecapPoster recap={recap} name={name} story />
            </ViewShot>
          </View>
        </Animated.View>
      ) : (
        <Animated.View
          key={`${month}-${failed}`}
          entering={FadeIn.duration(300)}
          className="items-center gap-3 rounded-[22px] border border-border-default bg-surface-secondary px-6 py-8"
        >
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary/15">
            <FontAwesome6
              name={failed ? "wifi" : "person-running"}
              size={20}
              color={themeColors.brand.primary}
            />
          </View>
          <Text className="text-center font-display text-heading-sm leading-7 text-text-primary">
            {t(failed ? "failed.title" : "empty.title")}
          </Text>
          <Text className="text-center text-body-sm leading-5 text-text-secondary">
            {failed ? t("failed.body") : t("empty.body", { count: recap?.eventsPlayed ?? 0 })}
          </Text>
          <View className="mt-2 self-stretch">
            <Button
              label={t(failed ? "failed.cta" : "empty.cta")}
              icon={failed ? "rotate-right" : "compass"}
              variant={failed ? "primary" : "secondary"}
              onPress={() =>
                failed ? setAttempt((value) => value + 1) : router.replace("/(tabs)")
              }
            />
          </View>
        </Animated.View>
      )}
    </AppScreen>
  );
}

function MonthArrow({
  icon,
  label,
  disabled = false,
  onPress,
}: {
  icon: "chevron-left" | "chevron-right";
  label: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={HIT_SLOP}
      onPress={onPress}
      className={`h-10 w-10 items-center justify-center rounded-full border border-border-default active:opacity-70 ${
        disabled ? "opacity-30" : ""
      }`}
    >
      <FontAwesome6 name={icon} size={13} color={themeColors.text.primary} />
    </Pressable>
  );
}
