import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import { View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useTranslation } from "react-i18next";

import { AppText as Text } from "@/components";
import {
  fonts,
  illustrationColors,
  palette,
  sportAccentToken,
} from "@/constants/theme";
import type { EventDetail } from "@/features/events/types";
import { getCurrentLocale } from "@/i18n";

export type ShareTemplate = "night" | "energy" | "minimal";

export function EventShareArtwork({
  event,
  eventUrl,
  template,
}: {
  event: EventDetail;
  eventUrl: string;
  template: ShareTemplate;
}) {
  const { t } = useTranslation("eventDetail");
  const width = 360;
  const height = 640;
  const accent = sportAccentToken(event.sport)?.accent ?? palette.lime;
  const isEnergy = template === "energy";
  const isMinimal = template === "minimal";
  const backgroundColor = isEnergy
    ? accent
    : isMinimal
      ? palette.ink
      : palette.canvas;
  const foregroundColor = isEnergy || isMinimal ? palette.canvas : palette.ink;
  const mutedColor = isEnergy
    ? illustrationColors.shareEnergyMuted
    : isMinimal
      ? illustrationColors.shareMinimalMuted
      : palette.inkMuted;
  const detailAccent = isEnergy ? palette.canvas : accent;
  const capacity = event.maxParticipants
    ? t("share.capacityWithMax", {
        count: event.participantCount,
        max: event.maxParticipants,
      })
    : t("share.capacityUnlimited", { count: event.participantCount });
  const date = new Intl.DateTimeFormat(getCurrentLocale(), {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(event.eventDate));

  return (
    <View
      collapsable={false}
      style={{
        width,
        height,
        overflow: "hidden",
        backgroundColor,
        padding: 28,
        justifyContent: "space-between",
      }}
    >
      <View
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 255,
          height: 260,
          opacity: isEnergy ? 0.12 : isMinimal ? 0.08 : 0.22,
          transform: [{ rotate: "8deg" }],
        }}
      >
        <FontAwesome6
          name={event.sportIcon}
          size={190}
          color={isEnergy || isMinimal ? palette.canvas : accent}
        />
      </View>

      <View style={{ gap: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
              width: 9,
              height: 9,
              borderRadius: 9,
              backgroundColor: accent,
            }}
          />
          <Text
            style={{
              color: foregroundColor,
              fontFamily: fonts.display,
              fontSize: 16,
            }}
          >
            Sportner
          </Text>
        </View>
        <View
          style={{
            alignSelf: "flex-start",
            borderRadius: 20,
            backgroundColor: isMinimal || isEnergy ? palette.canvas : accent,
            paddingHorizontal: 12,
            paddingVertical: 6,
          }}
        >
          <Text
            style={{
              color: isMinimal
                ? palette.ink
                : isEnergy
                  ? accent
                  : palette.canvas,
              fontFamily: fonts.bodyBold,
              fontSize: 11,
              letterSpacing: 1.2,
            }}
          >
            {event.sportName.toLocaleUpperCase(getCurrentLocale())}
          </Text>
        </View>
      </View>

      <View style={{ gap: 18 }}>
        <Text
          numberOfLines={3}
          style={{
            color: foregroundColor,
            fontFamily: fonts.display,
            fontSize: isEnergy ? 50 : 44,
            lineHeight: isEnergy ? 52 : 47,
            letterSpacing: -1.2,
          }}
        >
          {event.title}
        </Text>
        <View style={{ gap: 9 }}>
          <ArtworkInfo
            icon="calendar"
            text={date}
            accent={detailAccent}
            textColor={foregroundColor}
          />
          <ArtworkInfo
            icon="location-dot"
            text={event.location}
            accent={detailAccent}
            textColor={foregroundColor}
          />
          <ArtworkInfo
            icon="users"
            text={capacity}
            accent={detailAccent}
            textColor={foregroundColor}
          />
          <ArtworkInfo
            icon="id-card"
            text={t("primaryInfo.ageRange", {
              min: event.minParticipantAge,
              max: event.maxParticipantAge,
            })}
            accent={detailAccent}
            textColor={foregroundColor}
          />
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 18,
        }}
      >
        <View style={{ flex: 1, gap: 5 }}>
          <Text
            style={{
              color: detailAccent,
              fontFamily: fonts.bodyBold,
              fontSize: 18,
            }}
          >
            {t("share.artworkJoin")}
          </Text>
          <Text
            style={{
              color: mutedColor,
              fontFamily: fonts.body,
              fontSize: 11,
            }}
          >
            {t("share.artworkScanHint")}
          </Text>
        </View>
        <View
          style={{
            borderRadius: 14,
            backgroundColor: palette.white,
            padding: 7,
          }}
        >
          <QRCode value={eventUrl} size={58} color={palette.canvas} />
        </View>
      </View>
    </View>
  );
}

export function ArtworkInfo({
  icon,
  text,
  accent,
  textColor,
}: {
  icon: "calendar" | "location-dot" | "users" | "id-card";
  text: string;
  accent: string;
  textColor: string;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: `${accent}22`,
        }}
      >
        <FontAwesome6 name={icon} size={11} color={accent} />
      </View>
      <Text
        numberOfLines={1}
        style={{
          flex: 1,
          color: textColor,
          fontFamily: fonts.bodyBold,
          fontSize: 14,
        }}
      >
        {text}
      </Text>
    </View>
  );
}
