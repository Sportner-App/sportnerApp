import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { AppScreen, ScreenHeader, SportLoader } from "@/components";
import { useToast } from "@/contexts";
import { useProfile } from "@/hooks/use-profile";
import { getApiErrorMessage } from "@/lib/api/errors";
import { updateVisibility } from "@/services/profile-service";

export function PrivacyScreen() {
  const router = useRouter();
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

          <Pressable
            onPress={() => router.push("/profile/blocked")}
            className="mt-2 flex-row items-center gap-3 rounded-3xl border border-white/10 bg-brand-surface/90 px-4 py-4 active:opacity-70"
          >
            <View className="h-8 w-8 items-center justify-center rounded-full bg-background-secondary">
              <FontAwesome6 name="ban" size={12} color="#ccff00" />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="font-body text-base font-semibold text-white">
                Engellenenler
              </Text>
              <Text className="mt-0.5 font-body text-xs text-brand-neutral">
                Engellediğin kişileri gör ve engeli kaldır.
              </Text>
            </View>
            <FontAwesome6 name="chevron-right" size={10} color="#6f7d86" />
          </Pressable>
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
