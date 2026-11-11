import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, View } from "react-native";

import { AppText as Text, Avatar } from "@/components";
import { themeColors } from "@/constants/theme";
import {
  type ApiNotification,
  NOTIFICATION_TYPE as TYPE,
  notificationCopy,
} from "@/features/notifications/types";
import { formatCompactRelativeTime } from "@/utils/relative-time";

const VISUAL_SIZE = 44;

/** Kazanımlar lime zeminle ayrışır; listede ilk onlar göze çarpsın. */
const ACHIEVEMENT_ICONS: Partial<Record<number, string>> = {
  [TYPE.badgeEarned]: "medal",
  [TYPE.questCompleted]: "circle-check",
  [TYPE.challengeCompleted]: "trophy",
  [TYPE.districtCrowned]: "crown",
};

const TYPE_ICONS: Partial<Record<number, string>> = {
  [TYPE.eventAttendancePending]: "clipboard-check",
  [TYPE.eventReviewPrompt]: "star",
  [TYPE.reviewReceived]: "star",
  [TYPE.eventCancelled]: "calendar-xmark",
  [TYPE.streakAtRisk]: "fire",
  [TYPE.weeklyGoalNudge]: "bullseye",
  [TYPE.newEventsNearby]: "compass",
  [TYPE.comeBack]: "compass",
  [TYPE.challengesLaunched]: "flag-checkered",
  [TYPE.challengeEndingSoon]: "flag-checkered",
  [TYPE.districtLeaderTaken]: "crown",
  [TYPE.monthlyRecapReady]: "chart-simple",
  [TYPE.yearlyRecapReady]: "chart-simple",
  [TYPE.system]: "bell",
};

export function NotificationRow({
  item,
  onPress,
}: {
  item: ApiNotification;
  onPress: () => void;
}) {
  const copy = notificationCopy(item);
  const achievementIcon = ACHIEVEMENT_ICONS[item.notificationType];

  return (
    <Pressable
      onPress={onPress}
      className="flex-row gap-3 border-b border-border-default py-3.5 active:opacity-70"
    >
      {item.actorUserId ? (
        <Avatar
          uri={item.actorProfileImageUrl}
          name={item.actorUsername}
          size={VISUAL_SIZE}
        />
      ) : (
        <View
          className={`items-center justify-center rounded-full ${
            achievementIcon ? "bg-brand-primary" : "bg-surface-primary"
          }`}
          style={{ width: VISUAL_SIZE, height: VISUAL_SIZE }}
        >
          <FontAwesome6
            name={
              achievementIcon ??
              TYPE_ICONS[item.notificationType] ??
              "calendar-day"
            }
            size={17}
            color={
              achievementIcon
                ? themeColors.background.primary
                : themeColors.brand.primary
            }
          />
        </View>
      )}

      <View className={`flex-1 ${item.isRead ? "opacity-60" : ""}`}>
        <Text
          className={`text-body-sm text-text-primary ${
            item.isRead ? "font-body" : "font-body-bold"
          }`}
        >
          {copy.title}
        </Text>
        {copy.body && copy.body !== copy.title ? (
          <Text className="mt-0.5 font-body text-caption leading-[18px] text-text-secondary">
            {copy.body}
          </Text>
        ) : null}
      </View>

      <View className="items-end gap-2 pt-0.5">
        <Text className="font-body text-overline text-text-tertiary">
          {formatCompactRelativeTime(item.createdAt)}
        </Text>
        {item.isRead ? null : (
          <View className="h-2 w-2 rounded-full bg-brand-primary" />
        )}
      </View>
    </Pressable>
  );
}
