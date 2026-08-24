import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import {
  AppScreen,
  Button,
  ScreenHeader,
  SportLoader,
} from "@/components";
import { useSession, useToast } from "@/contexts";
import { getApiErrorMessage } from "@/lib/api/errors";
import { SportsSection } from "@/pages/profile/sports-section";
import { StatsSection } from "@/pages/profile/stats-section";
import { ProfileHero } from "@/pages/profile/profile-hero";
import { getPublicProfile } from "@/services/profile-service";
import { sendFriendRequest } from "@/services/social-service";
import type { UserProfile } from "@/types/profile";

export function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useSession();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      return;
    }
    void getPublicProfile(id)
      .then(setProfile)
      .catch((error) =>
        showToast({
          type: "error",
          title: "Profil yok",
          description: getApiErrorMessage(error),
        }),
      )
      .finally(() => setIsLoading(false));
  }, [id, showToast]);

  const isMe = user?.id === id;

  return (
    <AppScreen
      header={<ScreenHeader title="PROFİL" showBack />}
      contentClassName="gap-5 px-6 pt-3"
    >
      {isLoading ? (
        <View className="items-center py-16">
          <SportLoader size={140} label="Profil yükleniyor" />
        </View>
      ) : !profile ? (
        <Text className="text-center font-body text-sm text-brand-neutral">
          Profil bulunamadı.
        </Text>
      ) : (
        <>
          <ProfileHero profile={profile} />
          <StatsSection statistics={profile.statistics} />
          <SportsSection profile={profile} />
          <View className="flex-row gap-2">
            {!isMe ? (
              <View className="flex-1">
                <Button
                  label="Arkadaş ekle"
                  size="sm"
                  onPress={async () => {
                    try {
                      await sendFriendRequest(profile.userId);
                      showToast({ type: "success", title: "İstek gönderildi" });
                    } catch (error) {
                      showToast({
                        type: "error",
                        title: "Gönderilemedi",
                        description: getApiErrorMessage(error),
                      });
                    }
                  }}
                />
              </View>
            ) : null}
            <View className="flex-1">
              <Button
                label="Şikayet et"
                variant="outline"
                size="sm"
                onPress={() =>
                  router.push({
                    pathname: "/report",
                    params: { entityType: "0", entityId: profile.userId },
                  })
                }
              />
            </View>
          </View>
        </>
      )}
    </AppScreen>
  );
}
