import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { AppScreen, ScreenHeader, SportLoader } from "@/components";
import { useToast } from "@/contexts";
import { useProfile } from "@/hooks/use-profile";
import { getApiErrorMessage } from "@/lib/api/errors";
import { updateVisibility } from "@/services/profile-service";

export function PrivacyScreen() {
  const { profile, isLoading, refresh } = useProfile();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

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
        title: isProfilePublic ? "Profil açık" : "Profil gizli",
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Güncellenemedi",
        description: getApiErrorMessage(error),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen
      header={<ScreenHeader title="GİZLİLİK" showBack />}
      contentClassName="gap-5 px-6 pt-3"
    >
      {isLoading || !profile ? (
        <View className="items-center py-16">
          <SportLoader size={120} label="Yükleniyor" />
        </View>
      ) : (
        <>
          <Text className="font-display text-3xl text-white">Gizlilik</Text>
          <Text className="font-body text-sm text-brand-neutral">
            Profilinin kimler tarafından görüleceğini seç.
          </Text>

          <Option
            title="Herkese açık"
            description="Sporcular profilini ve istatistiklerini görebilir."
            active={profile.isProfilePublic}
            onPress={() => toggle(true)}
          />
          <Option
            title="Gizli"
            description="Yalnızca sen ve kısıtlı bağlantılar görür."
            active={!profile.isProfilePublic}
            onPress={() => toggle(false)}
          />
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
          : "border-white/10 bg-brand-surface/90"
      }`}
    >
      <Text className="font-body text-base font-semibold text-white">{title}</Text>
      <Text className="mt-1 font-body text-xs text-brand-neutral">
        {description}
      </Text>
    </Pressable>
  );
}
