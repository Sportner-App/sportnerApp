import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Share, View } from "react-native";
import ViewShot, { captureRef } from "react-native-view-shot";
import { useTranslation } from "react-i18next";

import { AppText as Text, BottomSheet } from "@/components";
import { themeColors } from "@/constants/theme";
import { useToast } from "@/contexts";
import type { EventDetail } from "@/features/events/types";
import { eventShareUrl } from "@/features/events/event-links";
import { EventShareArtwork } from "./event-share-artwork";
import type { ShareTemplate } from "./event-share-artwork";

type ShareTarget = "instagram" | "tiktok";
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
  const eventUrl = eventShareUrl(event.id);

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
            <Text className="font-body-bold text-caption text-text-secondary">
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
            <FontAwesome6
              name="spinner"
              size={20}
              color={themeColors.brand.primary}
            />
          </View>
        ) : null}
      </View>
      <Text className="text-center font-body-bold text-caption text-text-primary">
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
        <Text className="font-body-bold text-body text-text-primary">
          {loading ? t("share.preparing") : title}
        </Text>
        <Text className="font-body text-caption text-text-tertiary">
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
