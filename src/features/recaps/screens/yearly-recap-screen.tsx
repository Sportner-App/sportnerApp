import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, useWindowDimensions, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  FadeInDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ViewShot, { captureRef } from "react-native-view-shot";

import { AppText as Text, Avatar } from "@/components";
import { fonts, palette } from "@/constants/theme";
import { useAuth, useToast } from "@/contexts";
import {
  PosterBackdrop,
  useCountUp,
} from "@/features/profile/components/sport-report-card";
import { YearPoster } from "@/features/recaps/components/year-poster";
import { formatMonthName, formatWeekday } from "@/features/recaps/format";
import { getYearlyRecap } from "@/features/recaps/services/recaps-service";
import type { YearlyRecap } from "@/features/recaps/types";
import { sportIconForSlug } from "@/features/sports/sports";

const SLIDE_MS = 6000;

type SlideKey = "intro" | "events" | "sports" | "people" | "rhythm" | "places" | "persona" | "share";

/**
 * Yıllık özet (Wrapped): dokunarak ilerlenen tam ekran slaytlar, sonunda
 * hikâyede paylaşılacak kart. Sağa dokun ileri, sola dokun geri; her slayt
 * 6 sn sonra kendiliğinden geçer, paylaşım slaytında durur. Verisi olmayan
 * slaytlar (ör. partner yoksa "Ekibin") atlanır.
 */
export function YearlyRecapScreen() {
  const { t } = useTranslation("recap");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ year?: string }>();
  const [recap, setRecap] = useState<YearlyRecap | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [index, setIndex] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    const year = params.year ? Number(params.year) : undefined;
    setLoading(true);
    setFailed(false);
    getYearlyRecap(year)
      .then(setRecap)
      .catch(() => {
        setRecap(null);
        setFailed(true);
      })
      .finally(() => setLoading(false));
  }, [params.year, attempt]);

  const slides = useMemo<SlideKey[]>(() => {
    if (!recap?.isReady) return [];
    const list: SlideKey[] = ["intro", "events", "sports"];
    if (recap.topPartners.length > 0) list.push("people");
    list.push("rhythm");
    if (recap.districtsCount > 0 || recap.medals.length > 0 || recap.crowns.length > 0) {
      list.push("places");
    }
    list.push("persona", "share");
    return list;
  }, [recap]);

  const close = () => (router.canGoBack() ? router.back() : router.replace("/(tabs)"));
  const isLast = index === slides.length - 1;

  const next = () => {
    if (index < slides.length - 1) {
      setIndex((value) => value + 1);
      void Haptics.selectionAsync();
    }
  };
  const previous = () => setIndex((value) => Math.max(0, value - 1));

  useEffect(() => {
    cancelAnimation(progress);
    progress.value = 0;
    if (slides.length === 0 || isLast) {
      progress.value = 1;
      return;
    }
    progress.value = withTiming(1, { duration: SLIDE_MS, easing: Easing.linear }, (finished) => {
      if (finished) runOnJS(setIndex)(index + 1);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, slides.length]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.canvas, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={palette.lime} />
      </View>
    );
  }

  if (!recap?.isReady) {
    const year = recap?.year ?? (params.year ? Number(params.year) : new Date().getFullYear());
    return (
      <EmptyState
        year={year}
        failed={failed}
        topInset={insets.top}
        bottomInset={insets.bottom}
        onClose={close}
        onRetry={() => setAttempt((value) => value + 1)}
        onExplore={() => router.replace("/(tabs)")}
      />
    );
  }

  const slide = slides[index];

  return (
    <View style={{ flex: 1, backgroundColor: palette.canvas }}>
      <PosterBackdrop />

      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, gap: 12 }}>
        <View style={{ flexDirection: "row", gap: 4 }}>
          {slides.map((key, position) => (
            <ProgressSegment
              key={key}
              state={position < index ? "done" : position === index ? "active" : "todo"}
              progress={progress}
            />
          ))}
        </View>
        <CloseButton onPress={close} label={t("reveal.later")} />
      </View>

      <View style={{ flex: 1 }}>
        {slide !== "share" ? (
          <View style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, flexDirection: "row", zIndex: 1 }}>
            <Pressable accessibilityRole="button" accessibilityLabel={t("previous")} className="h-full flex-1" onPress={previous} />
            <Pressable accessibilityRole="button" accessibilityLabel={t("year.tapHint")} className="h-full flex-[2]" onPress={next} />
          </View>
        ) : null}

        <View
          key={slide}
          style={{
            flex: 1,
            paddingHorizontal: 28,
            paddingBottom: insets.bottom + 24,
            justifyContent: "center",
          }}
        >
          <Slide slide={slide} recap={recap} onBack={previous} />
        </View>
      </View>
    </View>
  );
}

/**
 * Özet yoksa (yılda 2'den az etkinlik) ya da yüklenemediyse. Hikâyenin
 * diliyle aynı: dokulu zemin, büyük yıl, tek net eylem.
 */
function EmptyState({
  year,
  failed,
  topInset,
  bottomInset,
  onClose,
  onRetry,
  onExplore,
}: {
  year: number;
  failed: boolean;
  topInset: number;
  bottomInset: number;
  onClose: () => void;
  onRetry: () => void;
  onExplore: () => void;
}) {
  const { t } = useTranslation("recap");
  const copy = failed ? "year.failed" : "year.empty";

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: palette.canvas,
        paddingTop: topInset + 8,
        paddingBottom: bottomInset + 24,
        paddingHorizontal: 28,
      }}
    >
      <PosterBackdrop />
      <View style={{ marginHorizontal: -12 }}>
        <CloseButton onPress={onClose} label={t("reveal.later")} />
      </View>

      <View style={{ flex: 1, justifyContent: "center", gap: 18 }}>
        <Animated.View
          entering={ZoomIn.springify().delay(100)}
          style={{
            width: 64,
            height: 64,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: palette.surfaceRaised,
            borderWidth: 1,
            borderColor: palette.line,
          }}
        >
          <FontAwesome6
            name={failed ? "wifi" : "person-running"}
            size={24}
            color={palette.lime}
          />
        </Animated.View>

        <Kicker>{t(`${copy}.kicker`, { year })}</Kicker>
        <Title size={30}>{t(`${copy}.title`, { year })}</Title>
        <Animated.Text
          entering={FadeInDown.duration(500).delay(400)}
          style={{ fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: palette.inkMuted }}
        >
          {t(`${copy}.body`, { year })}
        </Animated.Text>
      </View>

      <Animated.View entering={FadeInDown.duration(450).delay(600)} style={{ gap: 12 }}>
        <Pressable accessibilityRole="button" onPress={failed ? onRetry : onExplore} className="active:opacity-85">
          <View
            style={{
              height: 56,
              borderRadius: 28,
              flexDirection: "row",
              gap: 8,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: palette.lime,
            }}
          >
            <FontAwesome6
              name={failed ? "rotate-right" : "compass"}
              size={14}
              color={palette.canvas}
            />
            <Text style={{ fontFamily: fonts.display, fontSize: 16, color: palette.canvas }}>
              {t(`${copy}.cta`)}
            </Text>
          </View>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onClose} hitSlop={8}>
          <Text
            style={{ textAlign: "center", fontFamily: fonts.bodyBold, fontSize: 14, color: palette.inkMuted }}
          >
            {t("reveal.later")}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function ProgressSegment({
  state,
  progress,
}: {
  state: "done" | "active" | "todo";
  progress: { value: number };
}) {
  const fill = useAnimatedStyle(() => ({
    width: `${(state === "done" ? 1 : state === "active" ? progress.value : 0) * 100}%`,
  }));
  return (
    <View style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: palette.line, overflow: "hidden" }}>
      <Animated.View style={[{ height: 3, backgroundColor: palette.lime }, fill]} />
    </View>
  );
}

function CloseButton({ onPress, label }: { onPress: () => void; label: string }) {
  return (
    <View style={{ alignItems: "flex-end", zIndex: 2 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        hitSlop={12}
        onPress={onPress}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: palette.surfaceRaised,
        }}
      >
        <FontAwesome6 name="xmark" size={14} color={palette.ink} />
      </Pressable>
    </View>
  );
}

function Kicker({ children }: { children: string }) {
  return (
    <Animated.Text
      entering={FadeInDown.duration(450).delay(100)}
      style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 3, color: palette.lime }}
    >
      {children.toLocaleUpperCase()}
    </Animated.Text>
  );
}

function Title({
  children,
  delay = 250,
  size = 32,
}: {
  children: string;
  delay?: number;
  size?: number;
}) {
  return (
    <Animated.Text
      entering={FadeInDown.duration(500).delay(delay)}
      style={{ fontFamily: fonts.display, fontSize: size, lineHeight: size * 1.2, color: palette.ink }}
    >
      {children}
    </Animated.Text>
  );
}

function Line({ icon, text, delay }: { icon: string; text: string; delay: number }) {
  return (
    <Animated.View
      entering={FadeInDown.duration(450).delay(delay)}
      style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
    >
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 15,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: palette.surfaceRaised,
        }}
      >
        <FontAwesome6 name={icon} size={12} color={palette.lime} />
      </View>
      <Text style={{ flex: 1, fontFamily: fonts.bodyBold, fontSize: 16, color: palette.ink }}>{text}</Text>
    </Animated.View>
  );
}

function BigNumber({ value, delay = 400 }: { value: number; delay?: number }) {
  const text = useCountUp(value, true);
  return (
    <Animated.View entering={ZoomIn.springify().delay(delay)}>
      <Text style={{ fontFamily: fonts.display, fontSize: 128, lineHeight: 134, letterSpacing: -4, color: palette.lime }}>
        {text}
      </Text>
    </Animated.View>
  );
}

function Slide({ slide, recap, onBack }: { slide: SlideKey; recap: YearlyRecap; onBack: () => void }) {
  const { t } = useTranslation("recap");
  const gap = { gap: 18 };

  switch (slide) {
    case "intro":
      return (
        <View style={gap}>
          <Kicker>{t("year.intro.kicker")}</Kicker>
          <Animated.Text
            entering={ZoomIn.springify().delay(250)}
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{ fontFamily: fonts.display, fontSize: 112, lineHeight: 120, letterSpacing: -4, color: palette.lime }}
          >
            {String(recap.year)}
          </Animated.Text>
          <Title delay={700} size={24}>{t("year.intro.body")}</Title>
        </View>
      );
    case "events":
      return (
        <View style={gap}>
          <Kicker>{t("year.events.kicker")}</Kicker>
          <View>
            <BigNumber value={recap.eventsPlayed} />
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 20, color: palette.ink }}>
              {t("year.events.label", { count: recap.eventsPlayed })}
            </Text>
          </View>
          <View style={{ gap: 10 }}>
            <Line icon="stopwatch" text={t("year.events.hours", { hours: Math.round(recap.minutesPlayed / 60) })} delay={900} />
            <Line icon="shapes" text={t("year.events.sports", { count: recap.sportsCount })} delay={1100} />
            {recap.eventsOrganized > 0 ? (
              <Line icon="flag" text={t("year.events.organized", { count: recap.eventsOrganized })} delay={1300} />
            ) : null}
          </View>
        </View>
      );
    case "sports": {
      const max = Math.max(1, ...recap.topSports.map((sport) => sport.eventsPlayed));
      return (
        <View style={gap}>
          <Kicker>{t("year.sports.kicker")}</Kicker>
          {recap.topSports[0] ? <Title>{t("year.sports.title", { sport: recap.topSports[0].name })}</Title> : null}
          <View style={{ gap: 14, marginTop: 8 }}>
            {recap.topSports.map((sport, position) => (
              <Animated.View key={sport.slug} entering={FadeInDown.duration(450).delay(500 + position * 150)} style={{ gap: 6 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ width: 22, fontFamily: fonts.display, fontSize: 16, color: palette.inkMuted }}>
                    {position + 1}
                  </Text>
                  <FontAwesome6 name={sportIconForSlug(sport.slug)} size={13} color={palette.lime} />
                  <Text style={{ flex: 1, fontFamily: fonts.bodyBold, fontSize: 16, color: palette.ink }}>{sport.name}</Text>
                  <Text style={{ fontFamily: fonts.body, fontSize: 13, color: palette.inkMuted }}>
                    {t("year.sports.count", { count: sport.eventsPlayed })}
                  </Text>
                </View>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: palette.surfaceRaised, marginLeft: 30 }}>
                  <View
                    style={{
                      height: 6,
                      borderRadius: 3,
                      width: `${(sport.eventsPlayed / max) * 100}%`,
                      backgroundColor: position === 0 ? palette.lime : palette.inkMuted,
                    }}
                  />
                </View>
              </Animated.View>
            ))}
          </View>
        </View>
      );
    }
    case "people":
      return (
        <View style={gap}>
          <Kicker>{t("year.people.kicker")}</Kicker>
          <Title>{t("year.people.title", { count: recap.teammatesCount })}</Title>
          <View style={{ gap: 14, marginTop: 8 }}>
            {recap.topPartners.map((partner, position) => (
              <Animated.View
                key={partner.userId}
                entering={FadeInDown.duration(450).delay(600 + position * 180)}
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <Avatar uri={partner.profileImageUrl} name={partner.fullName} size={position === 0 ? 56 : 44} />
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={{ fontFamily: fonts.bodyBold, fontSize: position === 0 ? 18 : 15, color: palette.ink }}>
                    {partner.fullName || partner.username}
                  </Text>
                  <Text style={{ fontFamily: fonts.body, fontSize: 13, color: palette.inkMuted }}>
                    {t("year.people.together", { count: partner.eventsTogether })}
                  </Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </View>
      );
    case "rhythm": {
      const max = Math.max(1, ...recap.monthlyCounts);
      return (
        <View style={gap}>
          <Kicker>{t("year.rhythm.kicker")}</Kicker>
          {recap.busiestMonth ? <Title>{t("year.rhythm.title", { month: formatMonthName(recap.busiestMonth) })}</Title> : null}
          <Animated.View
            entering={FadeInDown.duration(500).delay(500)}
            style={{ flexDirection: "row", alignItems: "flex-end", gap: 4, height: 140, marginTop: 8 }}
          >
            {recap.monthlyCounts.map((count, month) => (
              <View key={month} style={{ flex: 1, alignItems: "center", gap: 4 }}>
                <View
                  style={{
                    width: "100%",
                    height: Math.max(4, (count / max) * 110),
                    borderRadius: 4,
                    backgroundColor: month + 1 === recap.busiestMonth ? palette.lime : palette.surfaceRaised,
                  }}
                />
                <Text style={{ fontFamily: fonts.body, fontSize: 9, color: palette.inkMuted }}>
                  {formatMonthName(month + 1).slice(0, 1).toLocaleUpperCase()}
                </Text>
              </View>
            ))}
          </Animated.View>
          <View style={{ gap: 10 }}>
            {recap.longestStreakWeeks > 0 ? (
              <Line icon="fire" text={t("year.rhythm.streak", { count: recap.longestStreakWeeks })} delay={900} />
            ) : null}
            {recap.busiestWeekday !== null ? (
              <Line icon="calendar-day" text={t("year.rhythm.weekday", { day: formatWeekday(recap.busiestWeekday) })} delay={1100} />
            ) : null}
          </View>
        </View>
      );
    }
    case "places":
      return (
        <View style={gap}>
          <Kicker>{t("year.places.kicker")}</Kicker>
          {recap.districtsCount > 0 ? <Title>{t("year.places.districts", { count: recap.districtsCount })}</Title> : null}
          <View style={{ gap: 10 }}>
            {recap.topDistrict ? (
              <Line icon="location-dot" text={t("year.places.topDistrict", { district: recap.topDistrict })} delay={600} />
            ) : null}
            {recap.medals.length > 0 ? (
              <Line icon="medal" text={t("year.places.medals", { count: recap.medals.length })} delay={800} />
            ) : null}
            {recap.crowns.length > 0 ? (
              <Line icon="crown" text={t("year.places.crowns", { count: recap.crowns.length })} delay={1000} />
            ) : null}
          </View>
        </View>
      );
    case "persona":
      return (
        <View style={gap}>
          <Kicker>{t("year.persona.kicker", { year: recap.year })}</Kicker>
          <Animated.Text
            entering={ZoomIn.springify().delay(400)}
            style={{ fontFamily: fonts.display, fontSize: 52, lineHeight: 56, color: palette.lime }}
          >
            {t(`year.persona.${recap.persona}.title`)}
          </Animated.Text>
          <Title delay={900}>{t(`year.persona.${recap.persona}.body`)}</Title>
        </View>
      );
    case "share":
      return <ShareSlide recap={recap} onBack={onBack} />;
  }
}

function ShareSlide({ recap, onBack }: { recap: YearlyRecap; onBack: () => void }) {
  const { t } = useTranslation("recap");
  const { user } = useAuth();
  const { showToast } = useToast();
  const { width } = useWindowDimensions();
  const storyRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);
  const name = user?.fullName || user?.username || "";
  const scale = Math.min(1, (width - 56) / 360);

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
      await Sharing.shareAsync(uri, { mimeType: "image/png", UTI: "public.png", dialogTitle: t("year.share.button") });
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

  return (
    <View style={{ alignItems: "center", gap: 16 }}>
      <Animated.View
        entering={ZoomIn.springify().delay(150)}
        style={{ width: 360 * scale, height: 600 * scale }}
      >
        <View style={{ transform: [{ scale }], transformOrigin: "top left" }}>
          <YearPoster recap={recap} name={name} />
        </View>
      </Animated.View>

      <View style={{ alignSelf: "stretch", flexDirection: "row", gap: 10 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("previous")}
          onPress={onBack}
          className="active:opacity-80"
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: palette.surfaceRaised,
            }}
          >
            <FontAwesome6 name="chevron-left" size={14} color={palette.ink} />
          </View>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => void share()} disabled={sharing} className="flex-1 active:opacity-85">
          <View
            style={{
              height: 56,
              borderRadius: 28,
              flexDirection: "row",
              gap: 8,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: palette.lime,
            }}
          >
            {sharing ? (
              <ActivityIndicator color={palette.canvas} />
            ) : (
              <FontAwesome6 name="arrow-up-from-bracket" size={14} color={palette.canvas} />
            )}
            <Text style={{ fontFamily: fonts.display, fontSize: 16, color: palette.canvas }}>{t("year.share.button")}</Text>
          </View>
        </Pressable>
      </View>

      <View pointerEvents="none" style={{ position: "absolute", left: -5000, top: 0 }}>
        <ViewShot ref={storyRef} options={{ format: "png" }}>
          <YearPoster recap={recap} name={name} story />
        </ViewShot>
      </View>
    </View>
  );
}
