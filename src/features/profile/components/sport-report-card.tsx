import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Image, Pressable, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Svg, {
  Defs,
  LinearGradient,
  Line,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import ViewShot, { captureRef } from "react-native-view-shot";

import { AppText as Text } from "@/components";
import { shareImage, type ImageShareTarget } from "@/lib/share/share-image";
import { brandColors, fonts, palette, themeColors } from "@/constants/theme";
import { useToast } from "@/contexts";
import {
  getSportReportCard,
  getStreak,
} from "@/features/profile/services/profile-service";
import type { IconName } from "@/types/components";
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
  const [sharing, setSharing] = useState<ImageShareTarget | null>(null);

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

  const share = async (target: ImageShareTarget) => {
    if (sharing) return;
    setSharing(target);
    try {
      const uri = await captureRef(storyRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
        width: 1080,
        height: 1920,
      });
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await shareImage(uri, target, t("reportCard.share"));
    } catch (error) {
      showToast({
        type: "error",
        title: t("reportCard.shareFailed"),
        description:
          error instanceof Error && error.message === "unavailable"
            ? t("reportCard.shareUnavailable")
            : undefined,
      });
    } finally {
      setSharing(null);
    }
  };

  return (
    <Animated.View entering={FadeInDown.duration(420)}>
      <ReportPoster card={card} name={name} streakWeeks={streakWeeks} animated />

      {isOwnProfile ? (
        <View className="mt-4 gap-2">
          <Text className="px-1 font-body-bold text-caption text-text-secondary">
            {t("reportCard.shareTo")}
          </Text>
          <View className="flex-row gap-2">
            <ShareTargetButton
              icon="instagram"
              brand="instagram"
              label={t("reportCard.targets.instagramStory")}
              busy={sharing === "instagramStory"}
              disabled={sharing != null}
              onPress={() => void share("instagramStory")}
            />
            <ShareTargetButton
              icon="whatsapp"
              brand="whatsapp"
              label={t("reportCard.targets.whatsapp")}
              busy={sharing === "whatsapp"}
              disabled={sharing != null}
              onPress={() => void share("whatsapp")}
            />
            <ShareTargetButton
              icon="arrow-up-from-bracket"
              label={t("reportCard.targets.other")}
              busy={sharing === "other"}
              disabled={sharing != null}
              onPress={() => void share("other")}
            />
          </View>
        </View>
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

function ShareTargetButton({
  icon,
  brand,
  label,
  busy,
  disabled,
  onPress,
}: {
  icon: IconName;
  /** Marka rengiyle dolu ikon rozeti; yoksa nötr. */
  brand?: "instagram" | "whatsapp";
  label: string;
  busy: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, busy }}
      disabled={disabled}
      onPress={onPress}
      className="flex-1 items-center gap-2 rounded-2xl border border-border-default bg-surface-primary px-2 py-3.5 active:bg-surface-secondary"
      style={{ opacity: disabled && !busy ? 0.5 : 1 }}
    >
      <View
        className="h-10 w-10 items-center justify-center overflow-hidden rounded-xl"
        style={{
          backgroundColor:
            brand === "whatsapp"
              ? brandColors.whatsapp
              : brand
                ? undefined
                : themeColors.surface.secondary,
        }}
      >
        {brand === "instagram" ? <InstagramGradient /> : null}
        {busy ? (
          <ActivityIndicator
            size="small"
            color={brand ? palette.white : themeColors.text.primary}
          />
        ) : (
          <FontAwesome6
            name={icon}
            size={20}
            color={brand ? palette.white : themeColors.text.primary}
          />
        )}
      </View>
      <Text
        numberOfLines={1}
        className="font-body-bold text-caption text-text-primary"
      >
        {label}
      </Text>
    </Pressable>
  );
}

function InstagramGradient() {
  const stops = brandColors.instagramGradient;
  return (
    <Svg style={{ position: "absolute", inset: 0 }} width="100%" height="100%">
      <Defs>
        <LinearGradient id="ig" x1="0" y1="1" x2="1" y2="0">
          {stops.map((color, index) => (
            <Stop
              key={color}
              offset={index / (stops.length - 1)}
              stopColor={color}
            />
          ))}
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#ig)" />
    </Svg>
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
