import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { AppScreen, Button, ScreenHeader, SportLoader } from "@/components";
import { ONBOARDING_SKILL_OPTIONS } from "@/constants/onboarding";
import { SKILL_LEVEL_LABELS, skillKeyFromCode } from "@/constants/profile";
import { useToast } from "@/contexts";
import { useProfile } from "@/hooks/use-profile";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  removeMySport,
  setPrimarySport,
  updateSportSkill,
} from "@/services/profile-service";
import { sportIconForSlug } from "@/utils/events";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

export function SportsEditScreen() {
  const router = useRouter();
  const { profile, isLoading, refresh } = useProfile();
  const { showToast } = useToast();

  const run = async (action: () => Promise<void>, title: string) => {
    try {
      await action();
      await refresh();
      showToast({ type: "success", title });
    } catch (error) {
      showToast({
        type: "error",
        title: "Güncellenemedi",
        description: getApiErrorMessage(error),
      });
    }
  };

  return (
    <AppScreen
      header={<ScreenHeader title="SPORLARIM" showBack />}
      contentClassName="gap-4 px-6 pt-3"
    >
      {isLoading || !profile ? (
        <View className="items-center py-16">
          <SportLoader size={120} label="Yükleniyor" />
        </View>
      ) : (
        <>
          <Text className="font-display text-3xl text-text-primary">
            Sporların
          </Text>
          <Text className="font-body text-sm text-brand-neutral">
            Seviyeni değiştir, birincil seç veya kaldır.
          </Text>

          {profile.sports.map((sport) => (
            <View
              key={sport.sportId}
              className="gap-3 rounded-3xl border border-border-default bg-surface-primary p-4"
            >
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-primary/15">
                  <FontAwesome6
                    name={sportIconForSlug(sport.sportSlug)}
                    size={15}
                    color="#ccff00"
                  />
                </View>
                <View className="flex-1">
                  <Text className="font-body text-sm font-semibold text-text-primary">
                    {sport.sportName}
                  </Text>
                  <Text className="font-body text-xs text-brand-neutral">
                    {SKILL_LEVEL_LABELS[skillKeyFromCode(sport.skillLevel)]}
                    {sport.isPrimary ? " · Birincil" : ""}
                  </Text>
                </View>
                <Pressable
                  onPress={() =>
                    run(() => removeMySport(sport.sportId), "Spor kaldırıldı")
                  }
                >
                  <FontAwesome6 name="trash" size={13} color="#fda4af" />
                </Pressable>
              </View>

              <View className="flex-row flex-wrap gap-2">
                {ONBOARDING_SKILL_OPTIONS.map((option) => {
                  const active = sport.skillLevel === option.level;
                  return (
                    <Pressable
                      key={option.key}
                      onPress={() =>
                        run(
                          () => updateSportSkill(sport.sportId, option.level),
                          "Seviye güncellendi",
                        )
                      }
                      className={`rounded-full border px-3 py-1.5 ${
                        active
                          ? "border-brand-primary bg-brand-primary"
                          : "border-border-default"
                      }`}
                    >
                      <Text
                        className={`font-body text-xs ${
                          active ? "text-brand-secondary" : "text-text-primary"
                        }`}
                      >
                        {option.shortLabel}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {!sport.isPrimary ? (
                <Button
                  label="Birincil yap"
                  variant="outline"
                  size="sm"
                  onPress={() =>
                    run(
                      () => setPrimarySport(sport.sportId),
                      "Birincil spor seçildi",
                    )
                  }
                />
              ) : null}
            </View>
          ))}

          <Button
            label="Yeni spor ekle"
            variant="outline"
            onPress={() => router.push("/profile/add-sport")}
          />
        </>
      )}
    </AppScreen>
  );
}
