import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";

import {
  AppScreen,
  AppText as Text,
  BottomSheet,
  Button,
  Input,
  ScreenHeader,
  ScreenLoader,
} from "@/components";
import { useAuth, useToast } from "@/contexts";
import { useProfile } from "@/features/profile/hooks/use-profile";
import {
  RESEND_COOLDOWN_SECONDS,
  VERIFICATION_CODE_LENGTH,
} from "@/constants/validation";
import { useCountdown } from "@/hooks/use-countdown";
import { themeColors } from "@/constants/theme";

export function PrivacyScreen() {
  const { t } = useTranslation(["profile", "common"]);
  const router = useRouter();
  const { profile, isLoading, refresh } = useProfile();
  const { showToast } = useToast();
  const { deleteAccount, verifyEmail, resendEmailVerification } = useAuth();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [verifyOpen, setVerifyOpen] = useState(false);
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const {
    seconds: cooldown,
    start: startCooldown,
    reset: resetCooldown,
  } = useCountdown();

  const openVerifySheet = async () => {
    setCode("");
    setVerifyOpen(true);
    await handleResend(true);
  };

  const handleResend = async (silent = false) => {
    if (isResending || cooldown > 0) {
      return;
    }

    setIsResending(true);
    try {
      const { error } = await resendEmailVerification();

      if (error) {
        if (!silent) {
          showToast({
            type: "error",
            title: t("profile:privacy.emailVerification.resendFailed"),
            description: error.message,
          });
        }
        return;
      }

      startCooldown(RESEND_COOLDOWN_SECONDS);
      if (!silent) {
        showToast({
          type: "success",
          title: t("profile:privacy.emailVerification.resendSuccess"),
        });
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async () => {
    if (isVerifying || code.trim().length !== VERIFICATION_CODE_LENGTH) {
      return;
    }

    setIsVerifying(true);
    try {
      const { error } = await verifyEmail(code.trim());

      if (error) {
        showToast({
          type: "error",
          title: t("profile:privacy.emailVerification.verifyFailed"),
          description: error.message,
        });
        return;
      }

      showToast({
        type: "success",
        title: t("profile:privacy.emailVerification.verifySuccess"),
      });
      setVerifyOpen(false);
      await refresh();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (isDeleting) {
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await deleteAccount();

      if (error) {
        showToast({
          type: "error",
          title: t("profile:privacy.deleteAccount.failed"),
          description: error.message,
        });
        return;
      }

      showToast({
        type: "success",
        title: t("profile:privacy.deleteAccount.success"),
      });
      router.replace("/(auth)/login");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppScreen
      header={<ScreenHeader title={t("profile:privacy.title")} showBack />}
      contentClassName="gap-5 px-6 pt-3"
    >
      {isLoading || !profile ? (
        <ScreenLoader />
      ) : (
        <>
          <Text className="font-display text-heading-lg text-text-primary">
            {t("profile:privacy.heading")}
          </Text>
          <Text className="font-body text-body-sm text-text-tertiary">
            {t("profile:privacy.subtitle")}
          </Text>

          {profile.email ? (
            <View className="gap-2">
              <Text className="font-body-bold text-caption uppercase tracking-wide text-text-tertiary">
                {t("profile:privacy.emailVerification.sectionTitle")}
              </Text>
              <Pressable
                onPress={profile.isEmailVerified ? undefined : openVerifySheet}
                disabled={profile.isEmailVerified}
                className="flex-row items-center gap-3 rounded-3xl border border-border-default bg-surface-primary px-4 py-4 active:opacity-70"
              >
                <View
                  className={`h-8 w-8 items-center justify-center rounded-full ${
                    profile.isEmailVerified
                      ? "bg-success/10"
                      : "bg-background-secondary"
                  }`}
                >
                  <FontAwesome6
                    name={profile.isEmailVerified ? "circle-check" : "envelope"}
                    size={12}
                    color={
                      profile.isEmailVerified
                        ? themeColors.verified
                        : themeColors.brand.primary
                    }
                  />
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="font-body-bold text-body text-text-primary">
                    {profile.isEmailVerified
                      ? t("profile:privacy.emailVerification.verifiedTitle")
                      : t("profile:privacy.emailVerification.unverifiedTitle")}
                  </Text>
                  <Text className="mt-0.5 font-body text-caption text-text-tertiary">
                    {profile.isEmailVerified
                      ? t(
                          "profile:privacy.emailVerification.verifiedDescription",
                          {
                            email: profile.email,
                          },
                        )
                      : t(
                          "profile:privacy.emailVerification.unverifiedDescription",
                          { email: profile.email },
                        )}
                  </Text>
                </View>
                {!profile.isEmailVerified ? (
                  <Text className="font-body-bold text-caption text-brand-primary">
                    {t("profile:privacy.emailVerification.verifyButton")}
                  </Text>
                ) : null}
              </Pressable>
            </View>
          ) : null}

          <Pressable
            onPress={() => router.push("/profile/blocked")}
            className="mt-2 flex-row items-center gap-3 rounded-3xl border border-border-default bg-surface-primary px-4 py-4 active:opacity-70"
          >
            <View className="h-8 w-8 items-center justify-center rounded-full bg-background-secondary">
              <FontAwesome6
                name="ban"
                size={12}
                color={themeColors.brand.primary}
              />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="font-body-bold text-body text-text-primary">
                {t("profile:privacy.blockedTitle")}
              </Text>
              <Text className="mt-0.5 font-body text-caption text-text-tertiary">
                {t("profile:privacy.blockedDescription")}
              </Text>
            </View>
            <FontAwesome6
              name="chevron-right"
              size={10}
              color={themeColors.text.tertiary}
            />
          </Pressable>

          <View className="mt-4 gap-2">
            <Text className="font-body-bold text-caption uppercase tracking-wide text-destructive">
              {t("profile:privacy.deleteAccount.sectionTitle")}
            </Text>
            <Pressable
              onPress={() => setDeleteConfirmOpen(true)}
              className="flex-row items-center gap-3 rounded-3xl border border-destructive/30 bg-destructive/5 px-4 py-4 active:opacity-70"
            >
              <View className="h-8 w-8 items-center justify-center rounded-full bg-destructive/10">
                <FontAwesome6
                  name="trash"
                  size={12}
                  color={themeColors.destructive}
                />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="font-body-bold text-body text-destructive">
                  {t("profile:privacy.deleteAccount.title")}
                </Text>
                <Text className="mt-0.5 font-body text-caption text-text-tertiary">
                  {t("profile:privacy.deleteAccount.description")}
                </Text>
              </View>
            </Pressable>
          </View>

          <BottomSheet
            visible={deleteConfirmOpen}
            onClose={() => {
              if (!isDeleting) {
                setDeleteConfirmOpen(false);
              }
            }}
            title={t("profile:privacy.deleteAccount.sheetTitle")}
            subtitle={t("profile:privacy.deleteAccount.sheetSubtitle")}
            showCancel={false}
            footer={
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Button
                    label={t("common:cancel")}
                    variant="dangerOutline"
                    disabled={isDeleting}
                    onPress={() => setDeleteConfirmOpen(false)}
                  />
                </View>
                <View className="flex-1">
                  <Button
                    label={t("profile:privacy.deleteAccount.confirm")}
                    variant="danger"
                    isLoading={isDeleting}
                    disabled={isDeleting}
                    onPress={() => void handleDeleteAccount()}
                  />
                </View>
              </View>
            }
          />

          <BottomSheet
            visible={verifyOpen}
            onClose={() => {
              if (!isVerifying) {
                setVerifyOpen(false);
              }
            }}
            title={t("profile:privacy.emailVerification.sheetTitle")}
            subtitle={t("profile:privacy.emailVerification.sheetSubtitle", {
              email: profile.email,
            })}
            showCancel={false}
            footer={
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Button
                    label={t("common:cancel")}
                    variant="dangerOutline"
                    disabled={isVerifying}
                    onPress={() => setVerifyOpen(false)}
                  />
                </View>
                <View className="flex-1">
                  <Button
                    label={t("profile:privacy.emailVerification.confirm")}
                    isLoading={isVerifying}
                    disabled={
                      isVerifying ||
                      code.trim().length !== VERIFICATION_CODE_LENGTH
                    }
                    onPress={() => void handleVerify()}
                  />
                </View>
              </View>
            }
          >
            <View className="gap-3">
              <Input
                icon="key"
                placeholder={t(
                  "profile:privacy.emailVerification.codePlaceholder",
                )}
                value={code}
                onChangeText={(value) =>
                  setCode(
                    value.replace(/\D/g, "").slice(0, VERIFICATION_CODE_LENGTH),
                  )
                }
                keyboardType="number-pad"
                maxLength={VERIFICATION_CODE_LENGTH}
              />
              <Pressable
                onPress={() => void handleResend()}
                disabled={isResending || cooldown > 0}
                className="items-center py-2"
              >
                <Text className="font-body-bold text-caption text-brand-primary">
                  {cooldown > 0
                    ? t("profile:privacy.emailVerification.resendCooldown", {
                        seconds: cooldown,
                      })
                    : t("profile:privacy.emailVerification.resend")}
                </Text>
              </Pressable>
            </View>
          </BottomSheet>
        </>
      )}
    </AppScreen>
  );
}
