import { useEffect, useState } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText as Text, BottomSheet, Button } from "@/components";
import { useGenderOptions } from "@/features/auth/copy";
import { ChoicePill } from "@/features/events/components/create/choice-pill";

type GenderRequiredSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Resolves true once the gender is saved (and the original action retried). */
  onSubmit: (gender: number) => Promise<boolean>;
};

/**
 * Asked only when a gender-restricted event needs a gender the profile
 * doesn't have, so the user can fill it in without leaving the event.
 */
export function GenderRequiredSheet({
  visible,
  onClose,
  onSubmit,
}: GenderRequiredSheetProps) {
  const { t } = useTranslation("eventDetail");
  // "Prefer not to say" can't satisfy a gender-restricted event, so it isn't offered here.
  const options = useGenderOptions().filter((option) => option.key !== "0");
  const [gender, setGender] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setGender(null);
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!gender) return;
    setIsSaving(true);
    try {
      await onSubmit(Number(gender));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={isSaving ? () => undefined : onClose}
      title={t("genderPrompt.title")}
      subtitle={t("genderPrompt.subtitle")}
      footer={
        <Button
          label={t("genderPrompt.submit")}
          isLoading={isSaving}
          disabled={isSaving || !gender}
          onPress={() => void handleSubmit()}
        />
      }
    >
      <View className="gap-3">
        <View className="flex-row flex-wrap gap-2">
          {options.map((option) => (
            <ChoicePill
              key={option.key}
              label={option.label}
              active={gender === option.key}
              onPress={() => setGender(option.key)}
            />
          ))}
        </View>
        <Text className="font-body text-caption text-text-tertiary">
          {t("genderPrompt.helper")}
        </Text>
      </View>
    </BottomSheet>
  );
}
