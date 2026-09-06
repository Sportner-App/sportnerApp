import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { Button } from "@/components";
import { shadows } from "@/constants/theme";
import type { ButtonVariant } from "@/types/components";
import type { EventDetail } from "@/types/events";
import {
  canAccessEventChat,
  formatEventFee,
  hasApprovedParticipation,
  hasEventEnded,
  hasPendingParticipation,
  hasEventInvitation,
} from "@/utils/events";

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
  isRespondingInvitation: boolean;
  onAcceptInvitation: () => void;
  onDeclineInvitation: () => void;
};

type BarContent = {
  statusTitle: string;
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
  const spotsLeft =
    event.maxParticipants == null
      ? null
      : Math.max(event.maxParticipants - event.participantCount, 0);

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
    statusTitle: spotsLeft == null ? t("join.spotsInfinite") : String(spotsLeft),
    statusSubtitle: event.isPaid
      ? `${t("join.spotsLeftSuffix")} · ${formatEventFee(true, event.feeAmount)}`
      : t("join.spotsLeftSuffix"),
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

  return (
    <View
      className="flex-row items-center gap-4 border-t border-border-default bg-surface-primary px-5 pt-3"
      style={[shadows.md, { paddingBottom: insets.bottom + 10 }]}
    >
      <View className="shrink">
        <Text
          className={
            bar.statusSubtitle
              ? "font-mono-bold text-lg text-text-primary"
              : "max-w-[120px] font-body-bold text-sm text-text-primary"
          }
        >
          {bar.statusTitle}
        </Text>
        {bar.statusSubtitle ? (
          <Text className="font-body text-xs text-text-secondary">
            {bar.statusSubtitle}
          </Text>
        ) : null}
      </View>

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
    </View>
  );
}
