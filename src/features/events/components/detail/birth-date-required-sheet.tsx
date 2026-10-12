import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { BottomSheet, Button, Input } from "@/components";
import { BIRTH_DATE_MAX_AGE, BIRTH_DATE_MIN_AGE } from "@/constants/validation";
import {
  formatBirthDateInput,
  isAllowedBirthDate,
  parseBirthDate,
  toApiBirthDate,
} from "@/utils/birth-date";

type BirthDateRequiredSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Resolves true once the birth date is saved (and the original action retried). */
  onSubmit: (apiBirthDate: string) => Promise<boolean>;
};

/**
 * Asked only when an age-restricted event needs a birth date the profile
 * doesn't have, so the user can fill it in without leaving the event.
 */
export function BirthDateRequiredSheet({
  visible,
  onClose,
  onSubmit,
}: BirthDateRequiredSheetProps) {
  const { t } = useTranslation("eventDetail");
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setBirthDate("");
      setError(undefined);
    }
  }, [visible]);

  const handleSubmit = async () => {
    const parsed = parseBirthDate(birthDate);
    if (!parsed) {
      setError(t("birthDatePrompt.invalidFormat"));
      return;
    }
    if (!isAllowedBirthDate(parsed)) {
      setError(
        t("birthDatePrompt.outOfRange", {
          min: BIRTH_DATE_MIN_AGE,
          max: BIRTH_DATE_MAX_AGE,
        }),
      );
      return;
    }

    setError(undefined);
    setIsSaving(true);
    try {
      await onSubmit(toApiBirthDate(birthDate));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={isSaving ? () => undefined : onClose}
      title={t("birthDatePrompt.title")}
      subtitle={t("birthDatePrompt.subtitle")}
      footer={
        <Button
          label={t("birthDatePrompt.submit")}
          isLoading={isSaving}
          disabled={isSaving || birthDate.length !== 10}
          onPress={() => void handleSubmit()}
        />
      }
    >
      <Input
        icon="calendar-days"
        label={t("birthDatePrompt.label")}
        placeholder={t("birthDatePrompt.placeholder")}
        value={birthDate}
        onChangeText={(value) => {
          setBirthDate(formatBirthDateInput(value));
          setError(undefined);
        }}
        keyboardType="number-pad"
        maxLength={10}
        autoFocus
        helperText={t("birthDatePrompt.helper")}
        error={error}
      />
    </BottomSheet>
  );
}
