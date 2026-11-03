import { useTranslation } from "react-i18next";
import { View } from "react-native";

import {
  AppScreen,
  AppText as Text,
  ScreenHeader,
  ScreenLoader,
} from "@/components";
import { useAuth } from "@/contexts";
import { ChallengeItem } from "@/features/challenges/components/challenge-item";
import { ChallengeMedals } from "@/features/challenges/components/challenge-medals";
import { useChallenges } from "@/features/challenges/hooks/use-challenges";

export function ChallengesScreen() {
  const { t } = useTranslation("badges");
  const { user } = useAuth();
  const { challenges, isLoading, busyId, join, leave } = useChallenges();

  return (
    <AppScreen
      header={<ScreenHeader title={t("challenges.title")} showBack />}
      contentClassName="gap-5 px-6 pt-3"
    >
      {isLoading ? (
        <ScreenLoader label={t("loading")} />
      ) : (
        <>
          <Text className="text-body-sm text-text-secondary">
            {t("challenges.intro")}
          </Text>

          {challenges.length === 0 ? (
            <Text className="text-body-sm text-text-tertiary">
              {t("challenges.empty")}
            </Text>
          ) : (
            challenges.map((challenge) => (
              <View
                key={challenge.id}
                className="rounded-[22px] border border-border-default bg-surface-secondary p-md"
              >
                <ChallengeItem
                  challenge={challenge}
                  busy={busyId === challenge.id}
                  onJoin={() => void join(challenge.id)}
                  onLeave={() => void leave(challenge.id)}
                />
              </View>
            ))
          )}

          {user?.id ? <ChallengeMedals userId={user.id} /> : null}
        </>
      )}
    </AppScreen>
  );
}
