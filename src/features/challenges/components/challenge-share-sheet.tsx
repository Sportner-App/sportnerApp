import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import ViewShot, { captureRef } from "react-native-view-shot";

import { BottomSheet, Button } from "@/components";
import { useAuth, useToast } from "@/contexts";
import { ChallengePoster } from "@/features/challenges/components/challenge-poster";
import type { Challenge } from "@/features/challenges/types";

const PREVIEW_SCALE = 0.6;

/** Tamamlanan challenge'ın görselini önizletip hikâye olarak paylaştırır. */
export function ChallengeShareSheet({
  visible,
  challenge,
  onClose,
}: {
  visible: boolean;
  challenge: Challenge | null;
  onClose: () => void;
}) {
  const { t } = useTranslation("badges");
  const { user } = useAuth();
  const { showToast } = useToast();
  const storyRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  if (!challenge) {
    return null;
  }

  const name = user?.fullName || user?.username || "";

  const share = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        throw new Error(t("challenges.share.unavailable"));
      }
      const uri = await captureRef(storyRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
        width: 1080,
        height: 1920,
      });
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        UTI: "public.png",
        dialogTitle: t("challenges.share.action"),
      });
    } catch (error) {
      showToast({
        type: "error",
        title: t("challenges.share.failed"),
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSharing(false);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={t("challenges.share.title")}
      subtitle={t("challenges.share.subtitle")}
    >
      <View className="items-center gap-4">
        <View
          className="overflow-hidden rounded-[20px] border border-border-default"
          style={{ width: 360 * PREVIEW_SCALE, height: 640 * PREVIEW_SCALE }}
        >
          <View
            style={{
              width: 360,
              height: 640,
              transform: [{ scale: PREVIEW_SCALE }],
              transformOrigin: "top left",
            }}
          >
            <ChallengePoster challenge={challenge} name={name} />
          </View>
        </View>
        <View className="self-stretch">
          <Button
            label={t("challenges.share.action")}
            icon="arrow-up-from-bracket"
            isLoading={sharing}
            onPress={() => void share()}
          />
        </View>
      </View>

      <View pointerEvents="none" className="absolute -left-[5000px] top-0">
        <ViewShot ref={storyRef} options={{ format: "png", quality: 1 }}>
          <ChallengePoster challenge={challenge} name={name} />
        </ViewShot>
      </View>
    </BottomSheet>
  );
}
