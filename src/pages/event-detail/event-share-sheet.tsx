import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import * as Sharing from "expo-sharing";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Share, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import ViewShot, { captureRef } from "react-native-view-shot";
import { useTranslation } from "react-i18next";

import { BottomSheet } from "@/components";
import { sportAccentToken, themeColors } from "@/constants/theme";
import { useToast } from "@/contexts";
import type { EventDetail } from "@/types/events";
import { currentDateLocale } from "@/utils/events";

type ShareTarget = "instagram" | "tiktok";
type ShareTemplate = "night" | "energy" | "minimal";

const SHARE_TEMPLATES: ShareTemplate[] = ["night", "energy", "minimal"];

export function EventShareSheet({
  visible,
  event,
  onClose,
}: {
  visible: boolean;
  event: EventDetail;
  onClose: () => void;
}) {
  const { t } = useTranslation("eventDetail");
  const nightRef = useRef<View>(null);
  const energyRef = useRef<View>(null);
  const minimalRef = useRef<View>(null);
  const [target, setTarget] = useState<ShareTarget | null>(null);
  const [busy, setBusy] = useState<ShareTemplate | "link" | null>(null);
  const { showToast } = useToast();
  const eventUrl = Linking.createURL(`/events/${event.id}`, {
    scheme: "sportner",
  });

  useEffect(() => {
    if (!visible) {
      setTarget(null);
      setBusy(null);
    }
  }, [visible]);

  const shareArtwork = async (template: ShareTemplate) => {
    if (!target || busy) return;
    setBusy(template);
    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        throw new Error(t("share.unavailable"));
      }

      const ref = {
        night: nightRef,
        energy: energyRef,
        minimal: minimalRef,
      }[template];
      const uri = await captureRef(ref, {
        format: "png",
        quality: 1,
        result: "tmpfile",
        width: 1080,
        height: 1920,
      });

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const dialogTitle =
        target === "instagram"
          ? t("share.instagramStoryDialogTitle")
          : t("share.tiktokStoryDialogTitle");

      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        UTI: "public.png",
        dialogTitle,
      });
    } catch (error) {
      showToast({
        type: "error",
        title: t("share.failedTitle"),
        description:
          error instanceof Error ? error.message : t("share.tryAgainGeneric"),
      });
    } finally {
      setBusy(null);
    }
  };

  const shareLink = async () => {
    if (busy) return;
    setBusy("link");
    try {
      await Share.share({
        title: event.title,
        message: t("share.shareMessage", { title: event.title, url: eventUrl }),
        url: eventUrl,
      });
    } catch (error) {
      showToast({
        type: "error",
        title: t("share.linkFailedTitle"),
        description:
          error instanceof Error ? error.message : t("share.tryAgainGeneric"),
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={target ? t("share.templateTitle") : t("share.title")}
      subtitle={
        target
          ? t("share.templateSubtitle", {
              platform:
                target === "instagram"
                  ? t("share.instagramLabel")
                  : t("share.tiktokLabel"),
            })
          : t("share.subtitle")
      }
    >
      {target ? (
        <View className="gap-4">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("share.backToPlatforms")}
            disabled={busy != null}
            onPress={() => setTarget(null)}
            className="self-start flex-row items-center gap-2 rounded-full bg-surface-primary px-3 py-2"
          >
            <FontAwesome6
              name="chevron-left"
              size={11}
              color={themeColors.text.secondary}
            />
            <Text className="font-body-bold text-xs text-text-secondary">
              {t("share.backToPlatforms")}
            </Text>
          </Pressable>

          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingHorizontal: 1 }}
          >
            {SHARE_TEMPLATES.map((template) => (
              <TemplateOption
                key={template}
                event={event}
                eventUrl={eventUrl}
                template={template}
                loading={busy === template}
                disabled={busy != null}
                onPress={() => void shareArtwork(template)}
              />
            ))}
          </ScrollView>
        </View>
      ) : (
        <View className="gap-3">
          <ShareOption
            icon="instagram"
            title={t("share.instagramStory")}
            description={t("share.instagramStoryDescription")}
            loading={false}
            disabled={busy != null}
            onPress={() => setTarget("instagram")}
          />
          <ShareOption
            icon="tiktok"
            title={t("share.tiktokStory")}
            description={t("share.tiktokStoryDescription")}
            loading={false}
            disabled={busy != null}
            onPress={() => setTarget("tiktok")}
          />
          <ShareOption
            icon="link"
            title={t("share.linkOption")}
            description={t("share.linkOptionDescription")}
            loading={busy === "link"}
            disabled={busy != null}
            onPress={() => void shareLink()}
          />
        </View>
      )}

      <View pointerEvents="none" className="absolute -left-[5000px] top-0">
        {SHARE_TEMPLATES.map((template) => (
          <ViewShot
            key={template}
            ref={
              template === "night"
                ? nightRef
                : template === "energy"
                  ? energyRef
                  : minimalRef
            }
            options={{ format: "png", quality: 1 }}
          >
            <EventShareArtwork
              event={event}
              eventUrl={eventUrl}
              template={template}
            />
          </ViewShot>
        ))}
      </View>
    </BottomSheet>
  );
}

function TemplateOption({
  event,
  eventUrl,
  template,
  loading,
  disabled,
  onPress,
}: {
  event: EventDetail;
  eventUrl: string;
  template: ShareTemplate;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation("eventDetail");
  const previewScale = 0.32;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t(`share.templates.${template}`)}
      disabled={disabled}
      onPress={onPress}
      className={`gap-2 ${disabled ? "opacity-50" : ""}`}
      style={{ width: 116 }}
    >
      <View
        className="overflow-hidden rounded-[20px] border border-border-default"
        style={{ width: 116, height: 206 }}
      >
        <View
          style={{
            width: 360,
            height: 640,
            transform: [{ scale: previewScale }],
            transformOrigin: "top left",
          }}
        >
          <EventShareArtwork
            event={event}
            eventUrl={eventUrl}
            template={template}
          />
        </View>
        {loading ? (
          <View className="absolute inset-0 items-center justify-center bg-black/55">
            <FontAwesome6 name="spinner" size={20} color="#ccff00" />
          </View>
        ) : null}
      </View>
      <Text className="text-center font-body-bold text-xs text-text-primary">
        {loading ? t("share.preparing") : t(`share.templates.${template}`)}
      </Text>
    </Pressable>
  );
}

function ShareOption({
  icon,
  title,
  description,
  loading,
  disabled,
  onPress,
}: {
  icon: "instagram" | "tiktok" | "link";
  title: string;
  description: string;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation("eventDetail");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      onPress={onPress}
      className={`flex-row items-center gap-3 rounded-[22px] border border-border-default bg-surface-primary px-4 py-3.5 ${disabled ? "opacity-50" : ""}`}
    >
      <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-primary/10">
        <FontAwesome6
          name={loading ? "spinner" : icon}
          size={17}
          color={themeColors.brand.primary}
        />
      </View>
      <View className="min-w-0 flex-1 gap-0.5">
        <Text className="font-body-bold text-[15px] text-text-primary">
          {loading ? t("share.preparing") : title}
        </Text>
        <Text className="font-body text-xs text-text-tertiary">
          {description}
        </Text>
      </View>
      <FontAwesome6
        name="chevron-right"
        size={11}
        color={themeColors.text.tertiary}
      />
    </Pressable>
  );
}

function EventShareArtwork({
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
  const accent = sportAccentToken(event.sport)?.accent ?? "#ccff00";
  const isEnergy = template === "energy";
  const isMinimal = template === "minimal";
  const backgroundColor = isEnergy ? accent : isMinimal ? "#f4f6f2" : "#06111a";
  const foregroundColor = isEnergy || isMinimal ? "#06111a" : "#f4f6f2";
  const mutedColor = isEnergy ? "#18301f" : isMinimal ? "#52606a" : "#a8b2b8";
  const detailAccent = isEnergy ? "#06111a" : accent;
  const capacity = event.maxParticipants
    ? t("share.capacityWithMax", {
        count: event.participantCount,
        max: event.maxParticipants,
      })
    : t("share.capacityUnlimited", { count: event.participantCount });
  const date = new Intl.DateTimeFormat(currentDateLocale(), {
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
          color={isEnergy || isMinimal ? "#06111a" : accent}
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
              fontFamily: "JetBrainsMono_700Bold",
              fontSize: 14,
              letterSpacing: 5,
            }}
          >
            SPORTNER
          </Text>
        </View>
        <View
          style={{
            alignSelf: "flex-start",
            borderRadius: 20,
            backgroundColor: isMinimal || isEnergy ? "#06111a" : accent,
            paddingHorizontal: 12,
            paddingVertical: 6,
          }}
        >
          <Text
            style={{
              color: isMinimal ? "#f4f6f2" : isEnergy ? accent : "#06111a",
              fontFamily: "HankenGrotesk_700Bold",
              fontSize: 11,
              letterSpacing: 1.2,
            }}
          >
            {event.sportName.toLocaleUpperCase(currentDateLocale())}
          </Text>
        </View>
      </View>

      <View style={{ gap: 18 }}>
        <Text
          numberOfLines={3}
          style={{
            color: foregroundColor,
            fontFamily: "Anybody_700Bold",
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
              fontFamily: "HankenGrotesk_700Bold",
              fontSize: 18,
            }}
          >
            {t("share.artworkJoin")}
          </Text>
          <Text
            style={{
              color: mutedColor,
              fontFamily: "HankenGrotesk_500Medium",
              fontSize: 11,
            }}
          >
            {t("share.artworkScanHint")}
          </Text>
        </View>
        <View
          style={{
            borderRadius: 14,
            backgroundColor: "#ffffff",
            padding: 7,
          }}
        >
          <QRCode value={eventUrl} size={58} color="#06111a" />
        </View>
      </View>
    </View>
  );
}

function ArtworkInfo({
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
          fontFamily: "HankenGrotesk_700Bold",
          fontSize: 14,
        }}
      >
        {text}
      </Text>
    </View>
  );
}
