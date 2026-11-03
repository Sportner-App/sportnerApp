import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Image, Pressable, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Svg, {
  Defs,
  Line,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import ViewShot, { captureRef } from "react-native-view-shot";

import { AppText as Text } from "@/components";
import { fonts, palette, themeColors } from "@/constants/theme";
import { useToast } from "@/contexts";
import {
  getSportReportCard,
  getStreak,
} from "@/features/profile/services/profile-service";
import type { SportReportCard as SportReportCardData } from "@/features/profile/types";
import { sportIconForSlug } from "@/features/sports/sports";

const LOGO = require("../../../../assets/images/icon.png");

type SportReportCardProps = {
  userId: string;
  /** Poster ve paylaşım görselinde görünen ad. */
  name: string;
  /** Kendi profilinde boş karne bir davet olarak görünüyor ve paylaşılabiliyor; başkasında gizli. */
  isOwnProfile?: boolean;
};

/**
 * Yılın spor karnesi: yoklamada "geldi" işaretlenen etkinliklerden hesaplanıyor.
 * Profilin en üstünde poster olarak duruyor; kendi profilinde hikâye
 * görseli (1080×1920) olarak paylaşılabiliyor.
 */
export function SportReportCard({
  userId,
  name,
  isOwnProfile = false,
}: SportReportCardProps) {
  const { t } = useTranslation("profile");
  const { showToast } = useToast();
  const storyRef = useRef<View>(null);
  const [card, setCard] = useState<SportReportCardData | null>(null);
  const [streakWeeks, setStreakWeeks] = useState(0);
  const [sharing, setSharing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void getSportReportCard(userId)
        .then(setCard)
        .catch(() => undefined);
      void getStreak(userId)
        .then((streak) => setStreakWeeks(streak?.currentStreak ?? 0))
        .catch(() => undefined);
    }, [userId]),
  );

  if (!card || (card.eventsPlayed === 0 && !isOwnProfile)) {
    return null;
  }

  if (card.eventsPlayed === 0) {
    return (
      <View className="flex-row items-center gap-3 rounded-[22px] border border-dashed border-border-default p-4">
        <FontAwesome6
          name="chart-simple"
          size={16}
          color={themeColors.brand.primary}
        />
        <View className="flex-1 gap-0.5">
          <Text className="font-body-bold text-body-sm text-text-primary">
            {t("reportCard.title", { year: card.year })}
          </Text>
          <Text className="text-caption text-text-secondary">
            {t("reportCard.empty")}
          </Text>
        </View>
      </View>
    );
  }

  const share = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        throw new Error(t("reportCard.shareUnavailable"));
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
        dialogTitle: t("reportCard.share"),
      });
    } catch (error) {
      showToast({
        type: "error",
        title: t("reportCard.shareFailed"),
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSharing(false);
    }
  };

  return (
    <Animated.View entering={FadeInDown.duration(420)}>
      <ReportPoster card={card} name={name} streakWeeks={streakWeeks} animated />

      {isOwnProfile ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => void share()}
          disabled={sharing}
          className="absolute right-4 top-4 flex-row items-center gap-1.5 rounded-full bg-brand-primary px-3 py-2 active:opacity-80"
        >
          {sharing ? (
            <ActivityIndicator size="small" color={palette.canvas} />
          ) : (
            <FontAwesome6
              name="arrow-up-from-bracket"
              size={11}
              color={palette.canvas}
            />
          )}
          <Text
            className="font-body-bold text-caption"
            style={{ color: palette.canvas }}
          >
            {t("reportCard.share")}
          </Text>
        </Pressable>
      ) : null}

      {isOwnProfile ? (
        <View pointerEvents="none" className="absolute -left-[5000px] top-0">
          <ViewShot ref={storyRef} options={{ format: "png" }}>
            <ReportPoster card={card} name={name} streakWeeks={streakWeeks} story />
          </ViewShot>
        </View>
      ) : null}
    </Animated.View>
  );
}

/** Sayıyı 0'dan hedefe ease-out ile saydırır. */
export function useCountUp(target: number, enabled: boolean, decimals = 0) {
  const [value, setValue] = useState(enabled ? 0 : target);

  useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }
    const duration = 1100;
    const start = Date.now();
    let frame = 0;
    const tick = () => {
      const progress = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, enabled]);

  const factor = Math.pow(10, decimals);
  return String(Math.round(value * factor) / factor);
}

/**
 * Hem profildeki kartın hem de paylaşılan hikâye görselinin tasarımı.
 * Paylaşılan görsel temadan bağımsız olmalı, bu yüzden sabit palet tonları.
 */
function ReportPoster({
  card,
  name,
  streakWeeks,
  animated = false,
  story = false,
}: {
  card: SportReportCardData;
  name: string;
  streakWeeks: number;
  animated?: boolean;
  story?: boolean;
}) {
  const { t } = useTranslation("profile");
  const hours = Math.round((card.minutesPlayed / 60) * 10) / 10;
  const events = useCountUp(card.eventsPlayed, animated);
  const hoursText = useCountUp(hours, animated, 1);
  const sports = useCountUp(card.sportsCount, animated);
  const teammates = useCountUp(card.teammatesCount, animated);
  const lead = card.topSports[0];

  const stats = [
    { value: hoursText, label: t("reportCard.hoursPlayed") },
    { value: sports, label: t("reportCard.sports") },
    { value: teammates, label: t("reportCard.teammates") },
  ];

  return (
    <View
      style={[
        {
          overflow: "hidden",
          borderRadius: story ? 0 : 26,
          backgroundColor: palette.canvas,
          padding: story ? 28 : 20,
          gap: story ? 26 : 18,
        },
        story ? { width: 360, height: 640, justifyContent: "space-between" } : null,
      ]}
    >
      <PosterBackdrop />

      <View style={{ gap: 4 }}>
        <Text
          style={{
            fontFamily: fonts.bodyBold,
            fontSize: 11,
            letterSpacing: 2.4,
            color: palette.lime,
          }}
        >
          {t("reportCard.kicker", { year: card.year }).toLocaleUpperCase()}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: fonts.displaySemiBold,
            fontSize: story ? 22 : 17,
            color: palette.ink,
            paddingRight: story ? 0 : 96,
          }}
        >
          {name}
        </Text>
        {streakWeeks > 0 ? (
          <View
            style={{
              alignSelf: "flex-start",
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              marginTop: 6,
              borderRadius: 999,
              paddingVertical: 4,
              paddingHorizontal: 10,
              backgroundColor: palette.surfaceRaised,
            }}
          >
            <FontAwesome6 name="fire" size={11} color={palette.lime} />
            <Text
              style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: palette.ink }}
            >
              {t("streak.badge", { count: streakWeeks })}
            </Text>
          </View>
        ) : null}
      </View>

      <View>
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: story ? 120 : 84,
            lineHeight: story ? 128 : 90,
            color: palette.lime,
            letterSpacing: -3,
          }}
        >
          {events}
        </Text>
        <Text
          style={{
            fontFamily: fonts.bodyBold,
            fontSize: story ? 18 : 15,
            color: palette.ink,
          }}
        >
          {t("reportCard.heroLabel", { count: card.eventsPlayed })}
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: 8 }}>
        {stats.map((stat) => (
          <View
            key={stat.label}
            style={{
              flex: 1,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: palette.line,
              backgroundColor: palette.surface,
              paddingVertical: 12,
              paddingHorizontal: 10,
              gap: 2,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 22,
                color: palette.ink,
              }}
            >
              {stat.value}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: fonts.body,
                fontSize: 11,
                color: palette.inkMuted,
              }}
            >
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      {card.topSports.length > 0 ? (
        <View style={{ gap: 10 }}>
          {lead ? (
            <Text
              style={{
                fontFamily: fonts.bodyBold,
                fontSize: 13,
                color: palette.inkMuted,
              }}
            >
              {t("reportCard.leadSport")}{" "}
              <Text style={{ color: palette.lime, fontFamily: fonts.bodyBold }}>
                {lead.name}
              </Text>
            </Text>
          ) : null}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {card.topSports.map((sport, index) => (
              <View
                key={sport.slug}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  borderRadius: 999,
                  paddingVertical: 7,
                  paddingHorizontal: 12,
                  backgroundColor: index === 0 ? palette.lime : palette.surfaceRaised,
                }}
              >
                <FontAwesome6
                  name={sportIconForSlug(sport.slug)}
                  size={12}
                  color={index === 0 ? palette.canvas : palette.lime}
                />
                <Text
                  style={{
                    fontFamily: fonts.bodyBold,
                    fontSize: 12,
                    color: index === 0 ? palette.canvas : palette.ink,
                  }}
                >
                  {sport.name} · {sport.eventsPlayed}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderTopWidth: 1,
          borderTopColor: palette.line,
          paddingTop: 12,
        }}
      >
        <View style={{ flexDirection: "row", gap: 14 }}>
          <FooterStat
            icon="circle-check"
            text={t("reportCard.attendance", {
              rate: Math.round(card.attendanceRate),
            })}
          />
          {card.totalReviews > 0 ? (
            <FooterStat icon="star" text={card.averageRating.toFixed(1)} />
          ) : null}
          {card.eventsOrganized > 0 && !story ? (
            <FooterStat
              icon="flag"
              text={t("reportCard.organized", { count: card.eventsOrganized })}
            />
          ) : null}
        </View>
        {story ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Image
              source={LOGO}
              style={{ width: 18, height: 18, borderRadius: 5 }}
            />
            <Text
              style={{
                fontFamily: fonts.displaySemiBold,
                fontSize: 12,
                color: palette.ink,
              }}
            >
              Sportner
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function FooterStat({
  icon,
  text,
}: {
  icon: "circle-check" | "star" | "flag";
  text: string;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      <FontAwesome6 name={icon} solid size={11} color={palette.lime} />
      <Text
        style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: palette.inkMuted }}
      >
        {text}
      </Text>
    </View>
  );
}

/** Köşede lime parıltı ve çapraz çizgiler: posterin "hareketli" dokusu. */
export function PosterBackdrop() {
  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="report-glow" cx="100%" cy="0%" r="75%">
            <Stop offset="0" stopColor={palette.lime} stopOpacity={0.32} />
            <Stop offset="1" stopColor={palette.lime} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#report-glow)" />
        {[0, 1, 2, 3].map((i) => (
          <Line
            key={i}
            x1={`${62 + i * 10}%`}
            y1="0%"
            x2={`${102 + i * 10}%`}
            y2="38%"
            stroke={palette.lime}
            strokeOpacity={0.12}
            strokeWidth={10}
          />
        ))}
      </Svg>
    </View>
  );
}
