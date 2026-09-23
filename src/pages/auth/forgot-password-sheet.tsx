import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";

import { BottomSheet, Button, Input } from "@/components";
import { useAuth, useToast } from "@/contexts";
import { AppText as Text } from "@/components/app-text";

const RESEND_COOLDOWN_SECONDS = 60;

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
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = setInterval(() => {
      setCooldown((value) => Math.max(value - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const reset = () => {
    setStep("email");
    setEmail("");
    setCode("");
    setNewPassword("");
    setCooldown(0);
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

      setCooldown(RESEND_COOLDOWN_SECONDS);
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
    if (isResetting || code.trim().length !== 6 || newPassword.length < 8) {
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
              isResetting || code.trim().length !== 6 || newPassword.length < 8
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
              setCode(value.replace(/\D/g, "").slice(0, 6))
            }
            keyboardType="number-pad"
            maxLength={6}
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
            <Text className="font-body text-caption font-semibold text-brand-primary">
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
