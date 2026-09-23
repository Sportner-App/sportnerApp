import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { Button } from "@/components";
import { shadows, themeColors } from "@/constants/theme";
import type { ButtonVariant } from "@/types/components";
import type { EventDetail } from "@/types/events";
import {
  canAccessEventChat,
  hasApprovedParticipation,
  hasEventEnded,
  hasPendingParticipation,
  hasEventInvitation,
} from "@/utils/events";
import { AppText as Text } from "@/components/app-text";

type JoinBarProps = {
  event: EventDetail;
  hasJoined: boolean;
  isJoining: boolean;
  isLeaving: boolean;
  isFull: boolean;
  isOrganizer: boolean;
  onJoin: () => void;
  onLeave: () => void;
  onChat: () => void;
  onShare: () => void;
  isRespondingInvitation: boolean;
  onAcceptInvitation: () => void;
  onDeclineInvitation: () => void;
};

type BarContent = {
  statusTitle?: string;
  statusSubtitle?: string;
  actionLabel: string;
  action?: () => void;
  variant: ButtonVariant;
  loading?: boolean;
  secondaryActionLabel?: string;
  secondaryAction?: () => void;
};

function occupancyLabel(t: TFunction<"eventDetail">, event: EventDetail) {
  if (event.maxParticipants == null) {
    return t("primaryInfo.countLabel", { count: event.participantCount });
  }

  return t("primaryInfo.countLabelWithMax", {
    count: event.participantCount,
    max: event.maxParticipants,
  });
}

function resolveBar({
  t,
  event,
  isJoining,
  isFull,
  isOrganizer,
  onJoin,
  onChat,
  isRespondingInvitation,
  onAcceptInvitation,
  onDeclineInvitation,
}: {
  t: TFunction<"eventDetail">;
  event: EventDetail;
  isJoining: boolean;
  isFull: boolean;
  isOrganizer: boolean;
  onJoin: () => void;
  onChat: () => void;
  isRespondingInvitation: boolean;
  onAcceptInvitation: () => void;
  onDeclineInvitation: () => void;
}): BarContent {
  const canChat = canAccessEventChat(
    event.myParticipationStatus,
    isOrganizer,
    event.conversationId,
    event.status,
  );
  const ended = hasEventEnded(event);

  if (isOrganizer) {
    return {
      statusTitle: occupancyLabel(t, event),
      actionLabel: ended ? t("join.chatDone") : t("join.chatGo"),
      action: canChat ? onChat : undefined,
      variant: ended ? "secondary" : "primary",
    };
  }

  if (hasApprovedParticipation(event.myParticipationStatus)) {
    return {
      statusTitle: ended ? t("join.eventEnded") : t("join.joined"),
      actionLabel: ended ? t("join.chatDone") : t("join.chatGo"),
      action: canChat ? onChat : undefined,
      variant: ended ? "secondary" : "primary",
    };
  }

  if (hasEventInvitation(event.myParticipationStatus)) {
    return {
      statusTitle: t("join.invitedBy", { name: event.hostName }),
      actionLabel: t("join.accept"),
      action: onAcceptInvitation,
      secondaryActionLabel: t("join.decline"),
      secondaryAction: onDeclineInvitation,
      variant: "primary",
      loading: isRespondingInvitation,
    };
  }

  if (hasPendingParticipation(event.myParticipationStatus)) {
    return {
      statusTitle: t("join.applicationSent"),
      actionLabel: t("join.awaitingApproval"),
      variant: "secondary",
    };
  }

  if (event.isOnWaitlist) {
    return {
      statusTitle: isFull ? t("join.full") : occupancyLabel(t, event),
      actionLabel: t("join.onWaitlist"),
      variant: "secondary",
    };
  }

  if (ended) {
    return {
      statusTitle:
        event.maxParticipants == null
          ? t("primaryInfo.countLabel", { count: event.participantCount })
          : occupancyLabel(t, event),
      actionLabel: t("join.closed"),
      variant: "secondary",
    };
  }

  if (isFull) {
    return {
      statusTitle: t("join.full"),
      actionLabel: t("join.joinWaitlist"),
      action: onJoin,
      variant: "primary",
      loading: isJoining,
    };
  }

  return {
    actionLabel: t("join.join"),
    action: onJoin,
    variant: "primary",
    loading: isJoining,
  };
}

export function JoinBar({
  event,
  isJoining,
  isFull,
  isOrganizer,
  onJoin,
  onChat,
  onShare,
  isRespondingInvitation,
  onAcceptInvitation,
  onDeclineInvitation,
}: JoinBarProps) {
  const { t } = useTranslation("eventDetail");
  const insets = useSafeAreaInsets();
  const bar = resolveBar({
    t,
    event,
    isJoining,
    isFull,
    isOrganizer,
    onJoin,
    onChat,
    isRespondingInvitation,
    onAcceptInvitation,
    onDeclineInvitation,
  });

  // Two action buttons (accept/decline) need the full row width, so the status
  // text moves above them instead of squeezing in beside the buttons + share icon.
  const hasTwoActions = Boolean(bar.secondaryActionLabel);

  return (
    <View
      className="gap-3 border-t border-border-default bg-surface-primary px-5 pt-3"
      style={[shadows.md, { paddingBottom: insets.bottom + 10 }]}
    >
      {bar.statusTitle && hasTwoActions ? (
        <Text className="font-body-bold text-body-sm text-text-primary">
          {bar.statusTitle}
        </Text>
      ) : null}

      <View className="flex-row items-center gap-4">
        {bar.statusTitle && !hasTwoActions ? (
          <View className="shrink">
            <Text
              className={
                bar.statusSubtitle
                  ? "font-mono-bold text-heading-sm text-text-primary"
                  : "max-w-[120px] font-body-bold text-body-sm text-text-primary"
              }
            >
              {bar.statusTitle}
            </Text>
            {bar.statusSubtitle ? (
              <Text className="font-body text-caption text-text-secondary">
                {bar.statusSubtitle}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View className="flex-1 flex-row gap-2">
          {bar.secondaryActionLabel ? (
            <View className="flex-1">
              <Button
                label={bar.secondaryActionLabel}
                size="lg"
                variant="outline"
                disabled={bar.loading}
                onPress={bar.secondaryAction}
              />
            </View>
          ) : null}
          <View className="flex-1">
            <Button
              label={bar.actionLabel}
              size="lg"
              variant={bar.variant}
              glow="subtle"
              isLoading={bar.loading}
              disabled={!bar.action}
              pressScale={0.98}
              haptic={bar.action ? "light" : undefined}
              onPress={bar.action}
            />
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("share.title")}
          hitSlop={4}
          onPress={onShare}
          className="h-11 w-11 items-center justify-center rounded-full border border-border-default bg-background-secondary active:opacity-80"
        >
          <FontAwesome6
            name="arrow-up-from-bracket"
            size={15}
            color={themeColors.brand.primary}
          />
        </Pressable>
      </View>
    </View>
  );
}
