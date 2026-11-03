import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useTranslation } from "react-i18next";
import { Image, View } from "react-native";

import { AppText as Text, Avatar } from "@/components";
import { fonts, palette } from "@/constants/theme";
import {
  PosterBackdrop,
  useCountUp,
} from "@/features/profile/components/sport-report-card";
import { formatRecapMonth, formatWeekday } from "@/features/recaps/format";
import type { MonthlyRecap } from "@/features/recaps/types";
import { sportIconForSlug } from "@/features/sports/sports";

const LOGO = require("../../../../assets/images/icon.png");

/**
 * Aylık özet posteri: ekranda ve paylaşılan hikâye görselinde (360×640 → 1080×1920)
 * aynı tasarım. Paylaşılan görsel temadan bağımsız, bu yüzden sabit palet tonları.
 */
export function RecapPoster({
  recap,
  name,
  animated = false,
  story = false,
}: {
  recap: MonthlyRecap;
  name: string;
  animated?: boolean;
  story?: boolean;
}) {
  const { t } = useTranslation("recap");
  const hours = Math.round((recap.minutesPlayed / 60) * 10) / 10;
  const events = useCountUp(recap.eventsPlayed, animated);
  const hoursText = useCountUp(hours, animated, 1);
  const sports = useCountUp(recap.sportsCount, animated);
  const teammates = useCountUp(recap.teammatesCount, animated);
  const delta = recap.eventsPlayed - recap.previousMonthEventsPlayed;
  const lead = recap.topSports[0];

  const stats = [
    { value: hoursText, label: t("stats.hours") },
    { value: sports, label: t("stats.sports") },
    { value: teammates, label: t("stats.teammates") },
  ];

  const highlights: { icon: string; label: string; value: string; avatar?: boolean }[] = [];
  if (lead) {
    highlights.push({
      icon: sportIconForSlug(lead.slug),
      label: t("highlights.sport"),
      value: t("highlights.sportValue", { sport: lead.name, count: lead.eventsPlayed }),
    });
  }
  if (recap.topPartner) {
    highlights.push({
      icon: "user-group",
      label: t("highlights.partner"),
      value: t("highlights.partnerValue", {
        name: recap.topPartner.fullName || recap.topPartner.username,
        count: recap.topPartner.eventsTogether,
      }),
      avatar: true,
    });
  }
  if (recap.topDistrict) {
    highlights.push({
      icon: "location-dot",
      label: t("highlights.district"),
      value: recap.topDistrict,
    });
  }
  if (recap.busiestWeekday !== null) {
    highlights.push({
      icon: "calendar-day",
      label: t("highlights.weekday"),
      value: formatWeekday(recap.busiestWeekday),
    });
  }

  return (
    <View
      style={[
        {
          overflow: "hidden",
          borderRadius: story ? 0 : 26,
          backgroundColor: palette.canvas,
          padding: story ? 28 : 20,
          gap: story ? 20 : 18,
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
          {t("kicker", { month: formatRecapMonth(recap.month) }).toLocaleUpperCase()}
        </Text>
        <Text
          numberOfLines={1}
          style={{ fontFamily: fonts.displaySemiBold, fontSize: story ? 22 : 17, color: palette.ink }}
        >
          {name}
        </Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 12 }}>
        <View>
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: story ? 104 : 84,
              lineHeight: story ? 112 : 90,
              color: palette.lime,
              letterSpacing: -3,
            }}
          >
            {events}
          </Text>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: story ? 17 : 15, color: palette.ink }}>
            {t("heroLabel", { count: recap.eventsPlayed })}
          </Text>
        </View>
        {delta !== 0 && recap.previousMonthEventsPlayed > 0 ? (
          <View
            style={{
              marginBottom: 6,
              borderRadius: 999,
              paddingVertical: 4,
              paddingHorizontal: 10,
              backgroundColor: palette.surfaceRaised,
            }}
          >
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: delta > 0 ? palette.lime : palette.inkMuted }}>
              {t(delta > 0 ? "deltaUp" : "deltaDown", { count: Math.abs(delta) })}
            </Text>
          </View>
        ) : null}
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
            <Text style={{ fontFamily: fonts.display, fontSize: 22, color: palette.ink }}>
              {stat.value}
            </Text>
            <Text numberOfLines={1} style={{ fontFamily: fonts.body, fontSize: 11, color: palette.inkMuted }}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ gap: 10 }}>
        {highlights.map((item) => (
          <View key={item.label} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {item.avatar && recap.topPartner ? (
              <Avatar
                uri={recap.topPartner.profileImageUrl}
                name={recap.topPartner.fullName}
                size={30}
              />
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
                <FontAwesome6 name={item.icon} size={12} color={palette.lime} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.body, fontSize: 11, color: palette.inkMuted }}>
                {item.label}
              </Text>
              <Text numberOfLines={1} style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: palette.ink }}>
                {item.value}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {recap.medals.length > 0 || recap.crownDistrict ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {recap.crownDistrict ? (
            <Chip icon="crown" text={t("crown", { district: recap.crownDistrict })} highlight />
          ) : null}
          {recap.medals.map((medal) => (
            <Chip key={medal.title} icon={medal.icon} text={medal.title} />
          ))}
        </View>
      ) : null}

      {story ? (
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
      ) : null}
    </View>
  );
}

function Chip({ icon, text, highlight = false }: { icon: string; text: string; highlight?: boolean }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        borderRadius: 999,
        paddingVertical: 6,
        paddingHorizontal: 11,
        backgroundColor: highlight ? palette.lime : palette.surfaceRaised,
      }}
    >
      <FontAwesome6 name={icon} size={11} color={highlight ? palette.canvas : palette.lime} />
      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: highlight ? palette.canvas : palette.ink }}>
        {text}
      </Text>
    </View>
  );
}
