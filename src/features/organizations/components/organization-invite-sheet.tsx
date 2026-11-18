import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText as Text, BottomSheet, Button } from "@/components";
import { HIT_SLOP, themeColors } from "@/constants/theme";

type ActionResult = { ok: boolean };
type Feedback = { kind: "success" | "error"; text: string };

const FEEDBACK_MS = 2500;
const CONFIRM_MS = 4000;

export function OrganizationInviteSheet({
  visible,
  onClose,
  organizationName,
  inviteCode,
  canRotate,
  onCopy,
  onShare,
  onShareWhatsApp,
  onRotate,
}: {
  visible: boolean;
  onClose: () => void;
  organizationName: string;
  inviteCode: string;
  canRotate: boolean;
  onCopy: () => Promise<ActionResult>;
  onShare: () => Promise<ActionResult>;
  onShareWhatsApp: () => Promise<ActionResult>;
  onRotate: () => Promise<ActionResult>;
}) {
  const { t } = useTranslation("organizations");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [confirmRotate, setConfirmRotate] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    feedbackTimer.current = null;
    confirmTimer.current = null;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  useEffect(() => {
    if (!visible) {
      clearTimers();
      setFeedback(null);
      setConfirmRotate(false);
    }
  }, [visible, clearTimers]);

  const showFeedback = (next: Feedback) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback(next);
    feedbackTimer.current = setTimeout(() => {
      setFeedback(null);
      feedbackTimer.current = null;
    }, FEEDBACK_MS);
  };

  const run = async (
    action: () => Promise<ActionResult>,
    successKey: string | null,
    errorKey: string,
  ) => {
    const result = await action();
    if (result.ok) {
      if (successKey) showFeedback({ kind: "success", text: t(successKey) });
      return;
    }
    showFeedback({ kind: "error", text: t(errorKey) });
  };

  const handleRotate = async () => {
    if (isRotating) return;
    if (!confirmRotate) {
      setConfirmRotate(true);
      confirmTimer.current = setTimeout(() => {
        setConfirmRotate(false);
        confirmTimer.current = null;
      }, CONFIRM_MS);
      return;
    }
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    confirmTimer.current = null;
    setConfirmRotate(false);
    setIsRotating(true);
    try {
      await run(onRotate, "detail.codeRotated", "detail.codeRotateFailed");
    } finally {
      setIsRotating(false);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={t("detail.inviteCodeLabel")}
      subtitle={organizationName}
      showCancel={false}
      footer={
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button
              label={t("detail.share")}
              size="sm"
              onPress={() => void run(onShare, null, "detail.shareFailed")}
            />
          </View>
          <View className="flex-1">
            <Button
              label="WhatsApp"
              size="sm"
              variant="outline"
              onPress={() =>
                void run(onShareWhatsApp, null, "detail.whatsappFailed")
              }
            />
          </View>
          {canRotate ? (
            <View className="flex-1">
              <Button
                label={
                  confirmRotate
                    ? t("detail.refreshCodeConfirm")
                    : t("detail.refreshCode")
                }
                size="sm"
                variant="outline"
                isLoading={isRotating}
                disabled={isRotating}
                onPress={() => void handleRotate()}
              />
            </View>
          ) : null}
        </View>
      }
    >
      <View className="flex-row items-center justify-between gap-3">
        <Pressable
          onPress={() =>
            void run(onCopy, "detail.codeCopied", "detail.shareFailed")
          }
          className="min-w-0 flex-1 active:opacity-70"
        >
          <Text
            selectable
            className="font-display text-heading-lg tracking-[0.18em] text-text-primary"
          >
            {inviteCode}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("detail.copyCodeAccessibility")}
          onPress={() =>
            void run(onCopy, "detail.codeCopied", "detail.shareFailed")
          }
          hitSlop={HIT_SLOP}
          className="active:opacity-70"
        >
          <FontAwesome6
            name="copy"
            size={16}
            color={themeColors.brand.primary}
          />
        </Pressable>
      </View>
      <Text
        className={`mt-2 font-body text-caption ${
          feedback?.kind === "error"
            ? "text-destructive"
            : feedback
              ? "text-brand-primary"
              : "text-text-tertiary"
        }`}
      >
        {feedback ? feedback.text : t("detail.copyCodeHint")}
      </Text>
    </BottomSheet>
  );
}
