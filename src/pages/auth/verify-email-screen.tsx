import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { BrandMark, Button, Input } from "@/components";
import { useAuth, useToast } from "@/contexts";

import { AnimatedBackground } from "./animated-background";

const RESEND_COOLDOWN_SECONDS = 60;

export function VerifyEmailScreen() {
  const { t } = useTranslation("auth");
  const router = useRouter();
  const { userEmail, verifyEmail, resendEmailVerification, signOut } =
    useAuth();
  const { showToast } = useToast();

  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isChangingAccount, setIsChangingAccount] = useState(false);
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

  const handleVerify = async () => {
    if (isVerifying || code.trim().length !== 6) {
      return;
    }

    setIsVerifying(true);
    try {
      const { error } = await verifyEmail(code.trim());

      if (error) {
        showToast({
          type: "error",
          title: t("verifyEmail.verifyFailed"),
          description: error.message,
        });
        return;
      }

      showToast({ type: "success", title: t("verifyEmail.verifySuccess") });
      // Session updates reactively — the route gate redirects once isEmailVerified flips.
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (isResending || cooldown > 0) {
      return;
    }

    setIsResending(true);
    try {
      const { error } = await resendEmailVerification();

      if (error) {
        showToast({
          type: "error",
          title: t("verifyEmail.resendFailed"),
          description: error.message,
        });
        return;
      }

      setCooldown(RESEND_COOLDOWN_SECONDS);
      showToast({ type: "success", title: t("verifyEmail.resendSuccess") });
    } finally {
      setIsResending(false);
    }
  };

  const handleChangeAccount = async () => {
    if (isChangingAccount) {
      return;
    }

    setIsChangingAccount(true);
    try {
      await signOut();
      router.replace("/(auth)/login");
    } finally {
      setIsChangingAccount(false);
    }
  };

  return (
    <View className="flex-1 bg-background-primary">
      <AnimatedBackground />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          contentContainerClassName="flex-grow justify-center px-6 py-14"
        >
          <View className="mb-10">
            <BrandMark tone="light" />
          </View>

          <Text className="font-display text-5xl leading-[52px] text-text-primary">
            {t("verifyEmail.title")}
          </Text>
          <Text className="mt-3 font-body text-base leading-6 text-brand-neutral">
            {t("verifyEmail.subtitle", { email: userEmail })}
          </Text>

          <View className="mt-9 rounded-[28px] border border-border-default bg-surface-primary p-5">
            <Input
              icon="key"
              placeholder={t("verifyEmail.codePlaceholder")}
              value={code}
              onChangeText={(value) =>
                setCode(value.replace(/\D/g, "").slice(0, 6))
              }
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />

            <View className="mt-6">
              <Button
                label={t("verifyEmail.confirm")}
                size="lg"
                isLoading={isVerifying}
                disabled={isVerifying || code.trim().length !== 6}
                pressScale={0.98}
                haptic="light"
                onPress={() => void handleVerify()}
              />
            </View>

            <Pressable
              onPress={() => void handleResend()}
              disabled={isResending || cooldown > 0}
              className="mt-4 items-center py-2"
            >
              <Text className="font-body text-xs font-semibold text-brand-primary">
                {cooldown > 0
                  ? t("verifyEmail.resendCooldown", { seconds: cooldown })
                  : t("verifyEmail.resend")}
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => void handleChangeAccount()}
            disabled={isChangingAccount}
            className="mt-8 items-center py-2"
          >
            <Text className="font-body text-xs text-brand-neutral">
              {t("verifyEmail.changeAccount")}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
