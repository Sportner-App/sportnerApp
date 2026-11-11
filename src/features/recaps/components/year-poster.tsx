import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { AppText as Text, Avatar } from "@/components";
import { fonts, palette } from "@/constants/theme";
import {
  PosterBrand,
  PosterGlow,
  PosterStatStrip,
} from "@/features/recaps/components/poster-parts";
import type { YearlyRecap } from "@/features/recaps/types";
import { sportIconForSlug } from "@/features/sports/sports";

/**
 * Yıllık özetin paylaşılan kartı (360×640 → 1080×1920). Temadan bağımsız
 * sabit palet; hikâyenin son slaytında da aynısı gösteriliyor.
 */
export function YearPoster({
  recap,
  name,
  story = false,
}: {
  recap: YearlyRecap;
  name: string;
  story?: boolean;
}) {
  const { t } = useTranslation("recap");
  const hours = Math.round(recap.minutesPlayed / 60);
  const lead = recap.topSports[0];
  const partner = recap.topPartners[0];

  const stats = [
    { value: String(hours), label: t("year.stats.hours") },
    { value: String(recap.sportsCount), label: t("year.stats.sports") },
    { value: String(recap.teammatesCount), label: t("year.stats.teammates") },
    { value: String(recap.longestStreakWeeks), label: t("year.stats.streak") },
  ];

  return (
    <View
      style={{
        width: 360,
        height: story ? 640 : 600,
        overflow: "hidden",
        borderRadius: story ? 0 : 26,
        borderWidth: story ? 0 : 1,
        borderColor: palette.line,
        backgroundColor: palette.canvas,
        padding: 28,
        justifyContent: "space-between",
      }}
    >
      <PosterGlow />

      <View style={{ position: "absolute", top: 28, right: 28 }}>
        <PosterBrand />
      </View>

      <View style={{ gap: 4, paddingRight: 90 }}>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 2.4, color: palette.lime }}>
          {t("year.share.kicker", { year: recap.year }).toLocaleUpperCase()}
        </Text>
        <Text numberOfLines={1} style={{ fontFamily: fonts.displaySemiBold, fontSize: 22, color: palette.ink }}>
          {name}
        </Text>
      </View>

      <View style={{ gap: 6 }}>
        <View
          style={{
            alignSelf: "flex-start",
            borderRadius: 999,
            paddingVertical: 6,
            paddingHorizontal: 12,
            backgroundColor: palette.lime,
          }}
        >
          <Text style={{ fontFamily: fonts.display, fontSize: 14, color: palette.canvas }}>
            {t(`year.persona.${recap.persona}.title`)}
          </Text>
        </View>
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 110,
            lineHeight: 116,
            letterSpacing: -4,
            color: palette.lime,
          }}
        >
          {recap.eventsPlayed}
        </Text>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 17, color: palette.ink }}>
          {t("year.events.label", { count: recap.eventsPlayed })}
        </Text>
      </View>

      <PosterStatStrip stats={stats} compact />

      <View style={{ gap: 10 }}>
        {lead ? (
          <PosterRow
            label={t("year.topSport")}
            value={lead.name}
            leading={<FontAwesome6 name={sportIconForSlug(lead.slug)} size={12} color={palette.lime} />}
          />
        ) : null}
        {partner ? (
          <PosterRow
            label={t("year.topPartner")}
            value={partner.fullName || partner.username}
            leading={<Avatar uri={partner.profileImageUrl} name={partner.fullName} size={30} />}
            bare
          />
        ) : null}
      </View>

    </View>
  );
}

function PosterRow({
  label,
  value,
  leading,
  bare = false,
}: {
  label: string;
  value: string;
  leading: React.ReactNode;
  bare?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      {bare ? (
        leading
      ) : (
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
          {leading}
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.body, fontSize: 11, color: palette.inkMuted }}>{label}</Text>
        <Text numberOfLines={1} style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: palette.ink }}>
          {value}
        </Text>
      </View>
    </View>
  );
}
