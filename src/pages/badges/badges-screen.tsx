import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppScreen, ScreenHeader, SportLoader } from "@/components";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useToast } from "@/contexts";
import {
  listBadgeProgress,
  listMyBadges,
  listMyQuests,
} from "@/services/gamification-service";
import type { ApiBadge, ApiQuest } from "@/types/social";

export function BadgesScreen() {
  const { t } = useTranslation("badges");
  const { showToast } = useToast();
  const [badges, setBadges] = useState<ApiBadge[]>([]);
  const [progress, setProgress] = useState<ApiBadge[]>([]);
  const [quests, setQuests] = useState<ApiQuest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void Promise.all([listMyBadges(), listBadgeProgress(), listMyQuests()])
      .then(([earned, remaining, myQuests]) => {
        setBadges(earned);
        setProgress(remaining);
        setQuests(myQuests);
      })
      .catch((error) =>
        showToast({
          type: "error",
          title: t("toasts.loadFailedTitle"),
          description: getApiErrorMessage(error),
        }),
      )
      .finally(() => setIsLoading(false));
  }, [showToast, t]);

  return (
    <AppScreen
      header={<ScreenHeader title={t("title")} showBack />}
      contentClassName="gap-4 px-6 pt-3"
    >
      {isLoading ? (
        <View className="items-center py-16">
          <SportLoader size={120} label={t("loading")} />
        </View>
      ) : (
        <>
          <Text className="font-display text-2xl text-text-primary">
            {t("sections.earned")}
          </Text>
          {badges.length === 0 ? (
            <Text className="font-body text-sm text-brand-neutral">
              {t("empty.badges")}
            </Text>
          ) : (
            badges.map((badge) => (
              <Card
                key={badge.id}
                title={badge.name}
                body={badge.description}
              />
            ))
          )}

          <Text className="mt-2 font-display text-2xl text-text-primary">
            {t("sections.progress")}
          </Text>
          {progress.map((badge) => (
            <Card
              key={badge.badgeId ?? badge.id}
              title={badge.name}
              body={t("progressBody", {
                percent: badge.percent ?? 0,
                current: badge.current ?? 0,
                target: badge.target ?? 0,
              })}
            />
          ))}

          <Text className="mt-2 font-display text-2xl text-text-primary">
            {t("sections.quests")}
          </Text>
          {quests.length === 0 ? (
            <Text className="font-body text-sm text-brand-neutral">
              {t("empty.quests")}
            </Text>
          ) : (
            quests.map((quest) => (
              <Card
                key={quest.id}
                title={quest.title}
                body={t("questBody", {
                  description: quest.description,
                  percent: quest.percent,
                })}
              />
            ))
          )}
        </>
      )}
    </AppScreen>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <View className="rounded-2xl border border-border-default bg-surface-primary p-4">
      <Text className="font-body text-sm font-semibold text-text-primary">
        {title}
      </Text>
      <Text className="mt-1 font-body text-xs text-brand-neutral">{body}</Text>
    </View>
  );
}
