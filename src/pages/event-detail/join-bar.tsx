import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components";
import type { ButtonVariant } from "@/types/components";
import type { EventDetail } from "@/types/events";
import {
  canAccessEventChat,
  hasApprovedParticipation,
  hasEventEnded,
  hasPendingParticipation,
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
};

type BarContent = {
  statusTitle: string;
  statusSubtitle?: string;
  actionLabel: string;
  action?: () => void;
  variant: ButtonVariant;
  loading?: boolean;
};

function occupancyLabel(event: EventDetail) {
  if (event.maxParticipants == null) {
    return `${event.participantCount} katılımcı`;
  }

  return `${event.participantCount} / ${event.maxParticipants} katılımcı`;
}

function resolveBar({
  event,
  isJoining,
  isFull,
  isOrganizer,
  onJoin,
  onChat,
}: {
  event: EventDetail;
  isJoining: boolean;
  isFull: boolean;
  isOrganizer: boolean;
  onJoin: () => void;
  onChat: () => void;
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
      statusTitle: occupancyLabel(event),
      actionLabel: "Sohbete Git",
      action: canChat ? onChat : undefined,
      variant: "primary",
    };
  }

  if (hasApprovedParticipation(event.myParticipationStatus)) {
    return {
      statusTitle: "✓ Katılıyorsun",
      actionLabel: "Sohbete Git",
      action: canChat ? onChat : undefined,
      variant: "primary",
    };
  }

  if (hasPendingParticipation(event.myParticipationStatus)) {
    return {
      statusTitle: "Başvurun gönderildi",
      actionLabel: "Onay bekliyor",
      variant: "secondary",
    };
  }

  if (event.isOnWaitlist) {
    return {
      statusTitle: isFull ? "Etkinlik dolu" : occupancyLabel(event),
      actionLabel: "Bekleme listesindesin",
      variant: "secondary",
    };
  }

  if (ended) {
    return {
      statusTitle:
        event.maxParticipants == null
          ? `${event.participantCount} katılımcı`
          : occupancyLabel(event),
      actionLabel: "Katılım kapalı",
      variant: "secondary",
    };
  }

  if (isFull) {
    return {
      statusTitle: "Etkinlik dolu",
      actionLabel: "Bekleme Listesine Katıl",
      action: onJoin,
      variant: "primary",
      loading: isJoining,
    };
  }

  return {
    statusTitle: spotsLeft == null ? "∞" : String(spotsLeft),
    statusSubtitle: "yer kaldı",
    actionLabel: "Katıl",
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
}: JoinBarProps) {
  const insets = useSafeAreaInsets();
  const bar = resolveBar({
    event,
    isJoining,
    isFull,
    isOrganizer,
    onJoin,
    onChat,
  });

  return (
    <View
      className="flex-row items-center gap-4 border-t border-white/10 bg-brand-secondary px-6 pt-4"
      style={{ paddingBottom: insets.bottom + 12 }}
    >
      <View className="shrink">
        <Text
          className={
            bar.statusSubtitle
              ? "font-mono text-lg text-brand-primary"
              : "max-w-[120px] font-body text-sm font-semibold text-white"
          }
        >
          {bar.statusTitle}
        </Text>
        {bar.statusSubtitle ? (
          <Text className="font-body text-xs text-brand-neutral">
            {bar.statusSubtitle}
          </Text>
        ) : null}
      </View>

      <View className="flex-1">
        <Button
          label={bar.actionLabel}
          size="lg"
          variant={bar.variant}
          isLoading={bar.loading}
          disabled={!bar.action}
          pressScale={0.98}
          haptic={bar.action ? "light" : undefined}
          onPress={bar.action}
        />
      </View>
    </View>
  );
}
