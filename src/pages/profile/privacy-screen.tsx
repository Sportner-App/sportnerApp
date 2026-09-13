import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppScreen, BottomSheet, Button, ScreenHeader, SportLoader } from "@/components";
import { useAuth, useToast } from "@/contexts";
import { useProfile } from "@/hooks/use-profile";
import { getApiErrorMessage } from "@/lib/api/errors";
import { updateVisibility } from "@/services/profile-service";

export function PrivacyScreen() {
  const { t } = useTranslation(["profile", "common"]);
  const router = useRouter();
  const { profile, isLoading, refresh } = useProfile();
  const { showToast } = useToast();
  const { deleteAccount } = useAuth();
  const [saving, setSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const toggle = async (isProfilePublic: boolean) => {
    if (!profile || saving || profile.isProfilePublic === isProfilePublic) {
      return;
    }

    setSaving(true);
    try {
      await updateVisibility(isProfilePublic);
      await refresh();
      showToast({
        type: "success",
        title: isProfilePublic
          ? t("profile:privacy.profilePublic")
          : t("profile:privacy.profilePrivate"),
      });
    } catch (error) {
      showToast({
        type: "error",
        title: t("profile:privacy.updateFailed"),
        description: getApiErrorMessage(error),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen
      header={<ScreenHeader title={t("profile:privacy.title")} showBack />}
      contentClassName="gap-5 px-6 pt-3"
    >
      {isLoading || !profile ? (
        <View className="items-center py-16">
          <SportLoader size={120} />
        </View>
      ) : (
        <>
          <Text className="font-display text-3xl text-text-primary">
            {t("profile:privacy.heading")}
          </Text>
          <Text className="font-body text-sm text-brand-neutral">
            {t("profile:privacy.subtitle")}
          </Text>

          <Option
            title={t("profile:privacy.publicTitle")}
            description={t("profile:privacy.publicDescription")}
            active={profile.isProfilePublic}
            onPress={() => toggle(true)}
          />
          <Option
            title={t("profile:privacy.privateTitle")}
            description={t("profile:privacy.privateDescription")}
            active={!profile.isProfilePublic}
            onPress={() => toggle(false)}
          />

          <Pressable
            onPress={() => router.push("/profile/blocked")}
            className="mt-2 flex-row items-center gap-3 rounded-3xl border border-border-default bg-surface-primary px-4 py-4 active:opacity-70"
          >
            <View className="h-8 w-8 items-center justify-center rounded-full bg-background-secondary">
              <FontAwesome6 name="ban" size={12} color="#ccff00" />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="font-body text-base font-semibold text-text-primary">
                {t("profile:privacy.blockedTitle")}
              </Text>
              <Text className="mt-0.5 font-body text-xs text-brand-neutral">
                {t("profile:privacy.blockedDescription")}
              </Text>
            </View>
            <FontAwesome6 name="chevron-right" size={10} color="#6f7d86" />
          </Pressable>

          <View className="mt-4 gap-2">
            <Text className="font-body text-xs font-semibold uppercase tracking-wide text-destructive">
              {t("profile:privacy.deleteAccount.sectionTitle")}
            </Text>
            <Pressable
              onPress={() => setDeleteConfirmOpen(true)}
              className="flex-row items-center gap-3 rounded-3xl border border-destructive/30 bg-destructive/5 px-4 py-4 active:opacity-70"
            >
              <View className="h-8 w-8 items-center justify-center rounded-full bg-destructive/10">
                <FontAwesome6 name="trash" size={12} color="#ef4444" />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="font-body text-base font-semibold text-destructive">
                  {t("profile:privacy.deleteAccount.title")}
                </Text>
                <Text className="mt-0.5 font-body text-xs text-brand-neutral">
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
          >
            <Button
              label={t("profile:privacy.deleteAccount.confirm")}
              variant="danger"
              isLoading={isDeleting}
              disabled={isDeleting}
              onPress={() => void handleDeleteAccount()}
            />
          </BottomSheet>
        </>
      )}
    </AppScreen>
  );
}

function Option({
  title,
  description,
  active,
  onPress,
}: {
  title: string;
  description: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-3xl border p-4 ${
        active
          ? "border-brand-primary/50 bg-brand-primary/10"
          : "border-border-default bg-surface-primary"
      }`}
    >
      <Text className="font-body text-base font-semibold text-text-primary">
        {title}
      </Text>
      <Text className="mt-1 font-body text-xs text-brand-neutral">
        {description}
      </Text>
    </Pressable>
  );
}
