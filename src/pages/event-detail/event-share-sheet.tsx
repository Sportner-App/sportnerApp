import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import * as Sharing from "expo-sharing";
import { useRef, useState } from "react";
import { Pressable, Share, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import ViewShot, { captureRef } from "react-native-view-shot";

import { BottomSheet } from "@/components";
import { sportImageForSlug } from "@/constants/sport-images";
import { sportAccentToken, themeColors } from "@/constants/theme";
import { useToast } from "@/contexts";
import type { EventDetail } from "@/types/events";

type ShareFormat = "story" | "post";

export function EventShareSheet({
  visible,
  event,
  onClose,
}: {
  visible: boolean;
  event: EventDetail;
  onClose: () => void;
}) {
  const storyRef = useRef<View>(null);
  const postRef = useRef<View>(null);
  const [busy, setBusy] = useState<ShareFormat | "link" | null>(null);
  const { showToast } = useToast();
  const eventUrl = Linking.createURL(`/events/${event.id}`, {
    scheme: "sportner",
  });

  const shareArtwork = async (format: ShareFormat) => {
    if (busy) return;
    setBusy(format);
    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        throw new Error("Bu cihazda görsel paylaşımı kullanılamıyor.");
      }

      const ref = format === "story" ? storyRef : postRef;
      const uri = await captureRef(ref, {
        format: "png",
        quality: 1,
        result: "tmpfile",
        width: 1080,
        height: format === "story" ? 1920 : 1350,
      });

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        UTI: "public.png",
        dialogTitle:
          format === "story"
            ? "Hikâye görselini paylaş"
            : "Gönderi görselini paylaş",
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Paylaşılamadı",
        description:
          error instanceof Error ? error.message : "Tekrar deneyebilirsin.",
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
        message: `${event.title} etkinliğine göz at: ${eventUrl}`,
        url: eventUrl,
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Bağlantı paylaşılamadı",
        description:
          error instanceof Error ? error.message : "Tekrar deneyebilirsin.",
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Etkinliği paylaş"
      subtitle="Hazır Sportner görselini seç veya etkinlik bağlantısını gönder."
    >
      <View className="gap-3">
        <ShareOption
          icon="instagram"
          title="Instagram Hikâyesi"
          description="9:16 hazır hikâye görseli"
          loading={busy === "story"}
          disabled={busy != null}
          onPress={() => void shareArtwork("story")}
        />
        <ShareOption
          icon="image"
          title="Instagram Gönderisi"
          description="4:5 dikey gönderi görseli"
          loading={busy === "post"}
          disabled={busy != null}
          onPress={() => void shareArtwork("post")}
        />
        <ShareOption
          icon="link"
          title="Bağlantıyı paylaş"
          description="WhatsApp, Mesajlar ve diğer uygulamalar"
          loading={busy === "link"}
          disabled={busy != null}
          onPress={() => void shareLink()}
        />
      </View>

      <View pointerEvents="none" className="absolute -left-[5000px] top-0">
        <ViewShot ref={storyRef} options={{ format: "png", quality: 1 }}>
          <EventShareArtwork
            event={event}
            eventUrl={eventUrl}
            format="story"
          />
        </ViewShot>
        <ViewShot ref={postRef} options={{ format: "png", quality: 1 }}>
          <EventShareArtwork
            event={event}
            eventUrl={eventUrl}
            format="post"
          />
        </ViewShot>
      </View>
    </BottomSheet>
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
  icon: "instagram" | "image" | "link";
  title: string;
  description: string;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
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
          {loading ? "Hazırlanıyor…" : title}
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
  format,
}: {
  event: EventDetail;
  eventUrl: string;
  format: ShareFormat;
}) {
  const width = 360;
  const height = format === "story" ? 640 : 450;
  const accent = sportAccentToken(event.sport)?.accent ?? "#ccff00";
  const photo = sportImageForSlug(event.sport);
  const capacity = event.maxParticipants
    ? `${event.participantCount}/${event.maxParticipants} katılımcı`
    : `${event.participantCount} katılımcı`;
  const date = new Intl.DateTimeFormat("tr-TR", {
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
        backgroundColor: "#06111a",
        padding: 28,
        justifyContent: "space-between",
      }}
    >
      {photo ? (
        <View
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: format === "story" ? 255 : 220,
            height: format === "story" ? 260 : 220,
            opacity: 0.22,
            transform: [{ rotate: "8deg" }],
          }}
        >
          <FontAwesome6
            name={event.sportIcon}
            size={format === "story" ? 190 : 150}
            color={accent}
          />
        </View>
      ) : null}

      <View style={{ gap: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{ width: 9, height: 9, borderRadius: 9, backgroundColor: accent }}
          />
          <Text
            style={{
              color: "#f4f6f2",
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
            backgroundColor: accent,
            paddingHorizontal: 12,
            paddingVertical: 6,
          }}
        >
          <Text
            style={{
              color: "#06111a",
              fontFamily: "HankenGrotesk_700Bold",
              fontSize: 11,
              letterSpacing: 1.2,
            }}
          >
            {event.sportName.toLocaleUpperCase("tr-TR")}
          </Text>
        </View>
      </View>

      <View style={{ gap: 18 }}>
        <Text
          numberOfLines={3}
          style={{
            color: "#f4f6f2",
            fontFamily: "Anybody_700Bold",
            fontSize: format === "story" ? 44 : 38,
            lineHeight: format === "story" ? 47 : 41,
            letterSpacing: -1.2,
          }}
        >
          {event.title}
        </Text>
        <View style={{ gap: 9 }}>
          <ArtworkInfo icon="calendar" text={date} accent={accent} />
          <ArtworkInfo icon="location-dot" text={event.location} accent={accent} />
          <ArtworkInfo icon="users" text={capacity} accent={accent} />
          <ArtworkInfo
            icon="id-card"
            text={`${event.minParticipantAge}–${event.maxParticipantAge} yaş`}
            accent={accent}
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
              color: accent,
              fontFamily: "HankenGrotesk_700Bold",
              fontSize: 18,
            }}
          >
            Sportner’da katıl
          </Text>
          <Text
            style={{
              color: "#a8b2b8",
              fontFamily: "HankenGrotesk_500Medium",
              fontSize: 11,
            }}
          >
            QR kodu tara ve etkinliği aç
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
}: {
  icon: "calendar" | "location-dot" | "users" | "id-card";
  text: string;
  accent: string;
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
          color: "#f4f6f2",
          fontFamily: "HankenGrotesk_700Bold",
          fontSize: 14,
        }}
      >
        {text}
      </Text>
    </View>
  );
}
