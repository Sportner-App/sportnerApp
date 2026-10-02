import { useState } from "react";
import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText as Text, BottomSheet, Button, Input } from "@/components";
import { useAuth, useToast } from "@/contexts";
import {
  PASSWORD_MIN_LENGTH,
  RESEND_COOLDOWN_SECONDS,
  VERIFICATION_CODE_LENGTH,
} from "@/constants/validation";
import { useCountdown } from "@/hooks/use-countdown";

type Step = "email" | "reset";

type ForgotPasswordSheetProps = {
  visible: boolean;
  onClose: () => void;
};

export function ForgotPasswordSheet({
  visible,
  onClose,
}: ForgotPasswordSheetProps) {
  const { t } = useTranslation(["auth", "common"]);
  const { requestPasswordReset, resetPassword } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const {
    seconds: cooldown,
    start: startCooldown,
    reset: resetCooldown,
  } = useCountdown();

  const reset = () => {
    setStep("email");
    setEmail("");
    setCode("");
    setNewPassword("");
    resetCooldown();
  };

  const handleClose = () => {
    if (isSendingCode || isResetting) {
      return;
    }
    reset();
    onClose();
  };

  const sendCode = async (silent = false) => {
    if (isSendingCode || cooldown > 0 || !email.trim()) {
      return;
    }

    setIsSendingCode(true);
    try {
      const { error } = await requestPasswordReset(email);

      if (error) {
        showToast({
          type: "error",
          title: t("auth:forgotPassword.requestFailed"),
          description: error.message,
        });
        return;
      }

      startCooldown(RESEND_COOLDOWN_SECONDS);
      setStep("reset");
      if (!silent) {
        showToast({
          type: "success",
          title: t("auth:forgotPassword.codeSent"),
        });
      }
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleReset = async () => {
    if (
      isResetting ||
      code.trim().length !== VERIFICATION_CODE_LENGTH ||
      newPassword.length < PASSWORD_MIN_LENGTH
    ) {
      return;
    }

    setIsResetting(true);
    try {
      const { error } = await resetPassword({
        email,
        code: code.trim(),
        newPassword,
      });

      if (error) {
        showToast({
          type: "error",
          title: t("auth:forgotPassword.resetFailed"),
          description: error.message,
        });
        return;
      }

      showToast({
        type: "success",
        title: t("auth:forgotPassword.resetSuccess"),
      });
      reset();
      onClose();
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      title={
        step === "email"
          ? t("auth:forgotPassword.sheetTitle")
          : t("auth:forgotPassword.codeSheetTitle")
      }
      subtitle={
        step === "reset"
          ? t("auth:forgotPassword.codeSheetSubtitle", { email })
          : undefined
      }
      footer={
        step === "email" ? (
          <Button
            label={t("auth:forgotPassword.sendCode")}
            isLoading={isSendingCode}
            disabled={isSendingCode || !email.trim()}
            onPress={() => void sendCode()}
          />
        ) : (
          <Button
            label={t("auth:forgotPassword.confirm")}
            isLoading={isResetting}
            disabled={
              isResetting ||
              code.trim().length !== VERIFICATION_CODE_LENGTH ||
              newPassword.length < PASSWORD_MIN_LENGTH
            }
            onPress={() => void handleReset()}
          />
        )
      }
    >
      {step === "email" ? (
        <Input
          icon="envelope"
          placeholder={t("fields.email")}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          autoComplete="email"
        />
      ) : (
        <View className="gap-3">
          <Input
            icon="key"
            placeholder={t("auth:forgotPassword.codePlaceholder")}
            value={code}
            onChangeText={(value) =>
              setCode(
                value.replace(/\D/g, "").slice(0, VERIFICATION_CODE_LENGTH),
              )
            }
            keyboardType="number-pad"
            maxLength={VERIFICATION_CODE_LENGTH}
          />
          <Input
            icon="lock"
            isPassword
            placeholder={t("auth:forgotPassword.newPasswordPlaceholder")}
            value={newPassword}
            onChangeText={setNewPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            textContentType="newPassword"
          />
          <Pressable
            onPress={() => void sendCode(true)}
            disabled={isSendingCode || cooldown > 0}
            className="items-center py-2"
          >
            <Text className="font-body-bold text-caption text-brand-primary">
              {cooldown > 0
                ? t("auth:forgotPassword.resendCooldown", { seconds: cooldown })
                : t("auth:forgotPassword.resend")}
            </Text>
          </Pressable>
        </View>
      )}
    </BottomSheet>
  );
}
