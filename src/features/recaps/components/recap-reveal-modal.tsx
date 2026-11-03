import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, View } from "react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText as Text } from "@/components";
import { STORAGE_KEYS } from "@/constants/storage-keys";
import { fonts, palette } from "@/constants/theme";
import { useAppTour, useAuth } from "@/contexts";
import {
  PosterBackdrop,
  useCountUp,
} from "@/features/profile/components/sport-report-card";
import {
  currentIstanbulMonth,
  formatRecapMonth,
  istanbulDayOfMonth,
  RECAP_READY_DAY,
  shiftMonth,
  yearlyRevealYear,
} from "@/features/recaps/format";
import {
  getMonthlyRecap,
  getYearlyRecap,
} from "@/features/recaps/services/recaps-service";
import type {
  MonthlyRecapPartner,
  MonthlyRecapSport,
} from "@/features/recaps/types";
import { sportIconForSlug } from "@/features/sports/sports";

/** Modalda gösterilen özet; aylık ve yıllık aynı kalıba indiriliyor. */
type Reveal = {
  kind: "month" | "year";
  kicker: string;
  eventsPlayed: number;
  minutesPlayed: number;
  topSport: MonthlyRecapSport | undefined;
  topPartner: MonthlyRecapPartner | null | undefined;
  open: () => void;
};

/**
 * Wrapped tarzı açılış: özet hazır olduktan sonra uygulama ilk açıldığında
 * bir kez tam ekran çıkar. Yıllık özet (15 Aralık–31 Ocak) önceliklidir; o
 * dönem dışında ya da yıllık görüldüyse geçen ayın özeti (ayın 3'ünden sonra).
 * Görülen ay/yıl cihazda tutulur; özet yoksa (2'den az etkinlik) hiç çıkmaz.
 * Uygulama turu açıkken beklenir, iki katman üst üste binmesin.
 */
export function RecapRevealModal() {
  const { t } = useTranslation("recap");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const { isVisible: isTourVisible } = useAppTour();
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || isTourVisible) {
      return;
    }
    let cancelled = false;
    const show = (value: Reveal) => {
      if (cancelled) return;
      setReveal(value);
      setVisible(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    void (async () => {
      try {
        const year = yearlyRevealYear();
        if (year !== null) {
          const seenYear = await AsyncStorage.getItem(STORAGE_KEYS.seenYearlyRecapReveal);
          if (seenYear !== String(year)) {
            const recap = await getYearlyRecap(year);
            if (recap?.isReady) {
              await AsyncStorage.setItem(STORAGE_KEYS.seenYearlyRecapReveal, String(year));
              show({
                kind: "year",
                kicker: String(year),
                eventsPlayed: recap.eventsPlayed,
                minutesPlayed: recap.minutesPlayed,
                topSport: recap.topSports[0],
                topPartner: recap.topPartners[0],
                open: () => router.push({ pathname: "/recap/year", params: { year: String(year) } }),
              });
              return;
            }
          }
        }

        if (istanbulDayOfMonth() < RECAP_READY_DAY) return;
        const month = shiftMonth(currentIstanbulMonth(), -1);
        const seen = await AsyncStorage.getItem(STORAGE_KEYS.seenRecapReveal);
        if (seen === month) return;
        const recap = await getMonthlyRecap(month);
        if (!recap?.isReady) return;
        await AsyncStorage.setItem(STORAGE_KEYS.seenRecapReveal, month);
        show({
          kind: "month",
          kicker: formatRecapMonth(recap.month),
          eventsPlayed: recap.eventsPlayed,
          minutesPlayed: recap.minutesPlayed,
          topSport: recap.topSports[0],
          topPartner: recap.topPartner,
          open: () => router.push({ pathname: "/recap", params: { month: recap.month } }),
        });
      } catch {
        // Özet gelmezse sessizce geç; bir sonraki açılışta yeniden denenir.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isTourVisible, router]);

  if (!reveal) {
    return null;
  }

  const close = () => setVisible(false);
  const open = () => {
    setVisible(false);
    reveal.open();
  };

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={close}>
      <RevealContent
        reveal={reveal}
        topInset={insets.top}
        bottomInset={insets.bottom}
        onOpen={open}
        onClose={close}
        t={t}
      />
    </Modal>
  );
}

function RevealContent({
  reveal,
  topInset,
  bottomInset,
  onOpen,
  onClose,
  t,
}: {
  reveal: Reveal;
  topInset: number;
  bottomInset: number;
  onOpen: () => void;
  onClose: () => void;
  t: ReturnType<typeof useTranslation<"recap">>["t"];
}) {
  const events = useCountUp(reveal.eventsPlayed, true);
  const hours =
    reveal.kind === "year"
      ? Math.round(reveal.minutesPlayed / 60)
      : Math.round((reveal.minutesPlayed / 60) * 10) / 10;
  const lead = reveal.topSport;

  const teasers: { icon: string; text: string }[] = [
    { icon: "stopwatch", text: t("reveal.hours", { hours }) },
  ];
  if (lead) {
    teasers.push({ icon: sportIconForSlug(lead.slug), text: t("reveal.sport", { sport: lead.name }) });
  }
  if (reveal.topPartner) {
    teasers.push({
      icon: "user-group",
      text: t("reveal.partner", {
        name: reveal.topPartner.fullName || reveal.topPartner.username,
      }),
    });
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: palette.canvas,
        paddingTop: topInset + 16,
        paddingBottom: bottomInset + 20,
        paddingHorizontal: 28,
        justifyContent: "space-between",
      }}
    >
      <PosterBackdrop />

      <View style={{ alignItems: "flex-end" }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("reveal.later")}
          hitSlop={12}
          onPress={onClose}
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

      <View style={{ gap: 18 }}>
        <Animated.Text
          entering={FadeInDown.duration(500).delay(150)}
          style={{
            fontFamily: fonts.bodyBold,
            fontSize: 12,
            letterSpacing: 3,
            color: palette.lime,
          }}
        >
          {reveal.kicker.toLocaleUpperCase()}
        </Animated.Text>
        <Animated.Text
          entering={FadeInDown.duration(500).delay(300)}
          style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 36, color: palette.ink }}
        >
          {t(reveal.kind === "year" ? "year.reveal.title" : "reveal.title")}
        </Animated.Text>

        <Animated.View entering={ZoomIn.springify().delay(550)}>
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 128,
              lineHeight: 134,
              letterSpacing: -4,
              color: palette.lime,
            }}
          >
            {events}
          </Text>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 18, color: palette.ink }}>
            {t("heroLabel", { count: reveal.eventsPlayed })}
          </Text>
        </Animated.View>

        <View style={{ gap: 10, marginTop: 6 }}>
          {teasers.map((item, index) => (
            <Animated.View
              key={item.text}
              entering={FadeInDown.duration(450).delay(900 + index * 180)}
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
                <FontAwesome6 name={item.icon} size={12} color={palette.lime} />
              </View>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: palette.ink }}>
                {item.text}
              </Text>
            </Animated.View>
          ))}
        </View>
      </View>

      <Animated.View entering={FadeInDown.duration(450).delay(1500)} style={{ gap: 12 }}>
        <Pressable accessibilityRole="button" onPress={onOpen} className="active:opacity-85">
          <View
            style={{
              minHeight: 56,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: palette.lime,
            }}
          >
            <Text style={{ fontFamily: fonts.display, fontSize: 16, color: palette.canvas }}>
              {t(reveal.kind === "year" ? "year.reveal.cta" : "reveal.cta")}
            </Text>
          </View>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onClose} hitSlop={8}>
          <Text
            style={{
              textAlign: "center",
              fontFamily: fonts.bodyBold,
              fontSize: 14,
              color: palette.inkMuted,
            }}
          >
            {t("reveal.later")}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
