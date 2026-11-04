import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useTranslation } from "react-i18next";
import { Image, View } from "react-native";

import { AppText as Text } from "@/components";
import { fonts, palette } from "@/constants/theme";
import type { Challenge } from "@/features/challenges/types";
import { PosterBackdrop } from "@/features/profile/components/sport-report-card";
import { getCurrentLocale } from "@/i18n";

const LOGO = require("../../../../assets/images/icon.png");

/**
 * Tamamlanan challenge'ın hikâye görseli (360×640 → 1080×1920). Paylaşılan
 * görsel temadan bağımsız, bu yüzden sabit palet tonları.
 */
export function ChallengePoster({
  challenge,
  name,
}: {
  challenge: Challenge;
  name: string;
}) {
  const { t } = useTranslation("badges");
  const completedOn = challenge.completedAt
    ? new Intl.DateTimeFormat(getCurrentLocale(), {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(challenge.completedAt))
    : null;

  return (
    <View
      style={{
        width: 360,
        height: 640,
        overflow: "hidden",
        backgroundColor: palette.canvas,
        padding: 28,
        justifyContent: "space-between",
      }}
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
          {t("challenges.poster.kicker").toLocaleUpperCase(getCurrentLocale())}
        </Text>
        <Text
          numberOfLines={1}
          style={{ fontFamily: fonts.displaySemiBold, fontSize: 22, color: palette.ink }}
        >
          {name}
        </Text>
      </View>

      <View style={{ gap: 18 }}>
        <View
          style={{
            width: 104,
            height: 104,
            borderRadius: 52,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: palette.lime,
          }}
        >
          <FontAwesome6 name={challenge.icon} size={44} color={palette.canvas} />
        </View>
        <Text
          numberOfLines={3}
          style={{
            fontFamily: fonts.display,
            fontSize: 38,
            lineHeight: 44,
            color: palette.ink,
          }}
        >
          {challenge.title}
        </Text>
        <Text
          numberOfLines={3}
          style={{
            fontFamily: fonts.body,
            fontSize: 15,
            lineHeight: 21,
            color: palette.inkMuted,
          }}
        >
          {t("challenges.poster.goal", { goal: challenge.description })}
        </Text>
      </View>

      <View style={{ gap: 14 }}>
        {completedOn ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <FontAwesome6 name="medal" size={13} color={palette.lime} />
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: palette.ink }}>
              {t("challenges.poster.completedOn", { date: completedOn })}
            </Text>
          </View>
        ) : null}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            borderTopWidth: 1,
            borderTopColor: palette.line,
            paddingTop: 12,
          }}
        >
          <Image source={LOGO} style={{ width: 18, height: 18, borderRadius: 5 }} />
          <Text style={{ fontFamily: fonts.displaySemiBold, fontSize: 12, color: palette.ink }}>
            Sportner
          </Text>
        </View>
      </View>
    </View>
  );
}
