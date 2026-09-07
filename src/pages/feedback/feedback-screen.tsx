import { useState } from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppScreen, Button, Input, ScreenHeader } from "@/components";
import { useToast } from "@/contexts";
import { getApiErrorMessage, isApiError } from "@/lib/api/errors";
import { submitAppFeedback } from "@/services/feedback-service";
import { successNotification } from "@/utils/haptics";

const MIN_LENGTH = 10;
const MAX_LENGTH = 2000;

export function FeedbackScreen() {
  const { t } = useTranslation("feedback");
  const { showToast } = useToast();
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);

  const trimmed = content.trim();
  const canSubmit = trimmed.length >= MIN_LENGTH && trimmed.length <= MAX_LENGTH;

  const handleSubmit = async () => {
    if (!canSubmit || saving) {
      return;
    }

    setSaving(true);
    try {
      await submitAppFeedback(trimmed);
      successNotification();
      setSent(true);
      setContent("");
      showToast({
        type: "success",
        title: t("toasts.receivedTitle"),
        description: t("toasts.receivedDescription"),
      });
    } catch (error) {
      showToast({
        type: "error",
        title: t("toasts.sendFailedTitle"),
        description:
          isApiError(error) && error.status === 429
            ? t("toasts.rateLimited")
            : getApiErrorMessage(error, t("toasts.sendFailedDescription")),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen
      keyboardAvoiding
      header={<ScreenHeader title={t("title")} showBack />}
      contentClassName="gap-4 px-6 pt-3"
    >
      <View className="gap-2">
        <Text className="font-display text-3xl text-white">
          {t("heading")}
        </Text>
        <Text className="font-body text-sm leading-5 text-brand-neutral">
          {t("subtitle")}
        </Text>
      </View>

      {sent ? (
        <View className="items-center gap-3 rounded-[28px] border border-brand-primary/30 bg-brand-primary/10 px-6 py-10">
          <Text className="font-body-bold text-base text-text-primary">
            {t("success.title")}
          </Text>
          <Text className="text-center font-body text-sm leading-5 text-text-tertiary">
            {t("success.description")}
          </Text>
          <Button
            label={t("success.cta")}
            variant="outline"
            size="sm"
            onPress={() => setSent(false)}
          />
        </View>
      ) : (
        <>
          <Input
            label={t("fieldLabel")}
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={MAX_LENGTH}
            style={{ minHeight: 140, paddingTop: 12, paddingBottom: 12 }}
            placeholder={t("placeholder")}
            helperText={t("helperText", {
              current: trimmed.length,
              max: MAX_LENGTH,
              min: MIN_LENGTH,
            })}
            error={
              trimmed.length > 0 && trimmed.length < MIN_LENGTH
                ? t("minLengthError", { min: MIN_LENGTH })
                : undefined
            }
          />
          <Button
            label={t("submit")}
            disabled={!canSubmit}
            isLoading={saving}
            onPress={() => void handleSubmit()}
          />
        </>
      )}
    </AppScreen>
  );
}
