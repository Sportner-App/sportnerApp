import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

import { AppScreen, Button, ScreenHeader, SportLoader } from "@/components";
import { useSkillLevelOptions } from "@/constants/onboarding";
import { skillKeyFromCode, useSkillLevelLabels } from "@/constants/profile";
import { useToast } from "@/contexts";
import { useProfile } from "@/hooks/use-profile";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  removeMySport,
  setPrimarySport,
  updateSportSkill,
} from "@/services/profile-service";
import { sportIconForSlug } from "@/utils/events";

export function SportsEditScreen() {
  const { t } = useTranslation(["profile", "common"]);
  const router = useRouter();
  const { profile, isLoading, refresh } = useProfile();
  const { showToast } = useToast();
  const SKILL_LEVEL_LABELS = useSkillLevelLabels();
  const ONBOARDING_SKILL_OPTIONS = useSkillLevelOptions();

  const run = async (action: () => Promise<void>, title: string) => {
    try {
      await action();
      await refresh();
      showToast({ type: "success", title });
    } catch (error) {
      showToast({
        type: "error",
        title: t("profile:sportsEdit.updateFailed"),
        description: getApiErrorMessage(error),
      });
    }
  };

  return (
    <AppScreen
      header={<ScreenHeader title={t("profile:sportsEdit.title")} showBack />}
      contentClassName="gap-4 px-6 pt-3"
    >
      {isLoading || !profile ? (
        <View className="items-center py-16">
          <SportLoader size={120} />
        </View>
      ) : (
        <>
          <Text className="font-display text-3xl text-text-primary">
            {t("profile:sportsEdit.heading")}
          </Text>
          <Text className="font-body text-sm text-brand-neutral">
            {t("profile:sportsEdit.subtitle")}
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
                    {sport.isPrimary
                      ? ` · ${t("profile:sportsEdit.primaryBadge")}`
                      : ""}
                  </Text>
                </View>
                <Pressable
                  onPress={() =>
                    run(
                      () => removeMySport(sport.sportId),
                      t("profile:sportsEdit.sportRemoved"),
                    )
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
                          t("profile:sportsEdit.levelUpdated"),
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
                  label={t("profile:sportsEdit.makePrimary")}
                  variant="outline"
                  size="sm"
                  onPress={() =>
                    run(
                      () => setPrimarySport(sport.sportId),
                      t("profile:sportsEdit.primarySelected"),
                    )
                  }
                />
              ) : null}
            </View>
          ))}

          <Button
            label={t("profile:sportsEdit.addSport")}
            variant="outline"
            onPress={() => router.push("/profile/add-sport")}
          />
        </>
      )}
    </AppScreen>
  );
}
