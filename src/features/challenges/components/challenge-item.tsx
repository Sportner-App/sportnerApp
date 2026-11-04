import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { AppText as Text, Button } from "@/components";
import { HIT_SLOP, themeColors } from "@/constants/theme";
import type { Challenge } from "@/features/challenges/types";
import type { IconName } from "@/types/components";

const DAY_MS = 24 * 60 * 60 * 1000;

export function daysLeft(challenge: Challenge, now = Date.now()) {
  return Math.max(
    0,
    Math.ceil((new Date(challenge.endsAt).getTime() - now) / DAY_MS),
  );
}

type ChallengeItemProps = {
  challenge: Challenge;
  busy?: boolean;
  /** Ana sayfa kartında açıklama ve ayrıl bağlantısı gizli. */
  compact?: boolean;
  onJoin: () => void;
  onLeave?: () => void;
  /** Verilirse tamamlanan challenge'da paylaş düğmesi çıkar. */
  onShare?: () => void;
};

/**
 * Tek challenge satırı: ikon, başlık, ilerleme çubuğu ve durumuna göre
 * Katıl düğmesi, ilerleme ya da madalya.
 */
export function ChallengeItem({
  challenge,
  busy = false,
  compact = false,
  onJoin,
  onLeave,
  onShare,
}: ChallengeItemProps) {
  const { t } = useTranslation("badges");
  const ratio = Math.min(1, challenge.progress / challenge.targetValue);
  const remainingDays = daysLeft(challenge);

  return (
    <View className="gap-2.5">
      <View className="flex-row items-center gap-3">
        <View
          className={`h-11 w-11 items-center justify-center rounded-2xl ${
            challenge.isCompleted ? "bg-brand-primary" : "bg-brand-primary/15"
          }`}
        >
          <FontAwesome6
            name={(challenge.isCompleted ? "medal" : challenge.icon) as IconName}
            size={17}
            color={
              challenge.isCompleted
                ? themeColors.background.primary
                : themeColors.brand.primary
            }
          />
        </View>

        <View className="flex-1 gap-0.5">
          <Text
            numberOfLines={1}
            className="font-body-bold text-body text-text-primary"
          >
            {challenge.title}
          </Text>
          <Text
            numberOfLines={compact ? 1 : 2}
            className="text-caption text-text-secondary"
          >
            {compact
              ? t("challenges.meta", {
                  days: remainingDays,
                  count: challenge.participantCount,
                })
              : challenge.description}
          </Text>
        </View>

        {challenge.isCompleted ? (
          <View className="rounded-full bg-brand-primary/15 px-3 py-1.5">
            <Text className="font-body-bold text-caption text-brand-primary">
              {t("challenges.completed")}
            </Text>
          </View>
        ) : challenge.isJoined ? (
          <Text className="font-display text-body text-text-primary">
            {challenge.progress}/{challenge.targetValue}
          </Text>
        ) : (
          <Button
            label={t("challenges.join")}
            size="sm"
            isLoading={busy}
            onPress={onJoin}
          />
        )}
      </View>

      {challenge.isJoined && !challenge.isCompleted ? (
        <View className="h-1.5 overflow-hidden rounded-full bg-border-default">
          <View
            className="h-full rounded-full bg-brand-primary"
            style={{ width: `${Math.max(ratio * 100, 4)}%` }}
          />
        </View>
      ) : null}

      {challenge.isCompleted && onShare ? (
        <Button
          label={t("challenges.share.action")}
          icon="arrow-up-from-bracket"
          size="sm"
          variant="secondary"
          onPress={onShare}
        />
      ) : null}

      {!compact ? (
        <View className="flex-row items-center justify-between">
          <Text className="text-overline text-text-tertiary">
            {t("challenges.meta", {
              days: remainingDays,
              count: challenge.participantCount,
            })}
            {challenge.completedCount > 0
              ? ` · ${t("challenges.finishers", { count: challenge.completedCount })}`
              : ""}
          </Text>
          {challenge.isJoined && !challenge.isCompleted && onLeave ? (
            <Pressable
              accessibilityRole="button"
              hitSlop={HIT_SLOP}
              disabled={busy}
              onPress={onLeave}
            >
              <Text className="text-overline text-text-tertiary underline">
                {t("challenges.leave")}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
