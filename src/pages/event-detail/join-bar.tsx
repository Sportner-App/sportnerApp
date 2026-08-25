import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components";
import type { EventDetail } from "@/types/events";
import {
  canAccessEventChat,
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

export function JoinBar({
  event,
  hasJoined,
  isJoining,
  isLeaving,
  isFull,
  isOrganizer,
  onJoin,
  onLeave,
  onChat,
}: JoinBarProps) {
  const insets = useSafeAreaInsets();
  const spotsLeft =
    event.maxParticipants == null
      ? null
      : Math.max(event.maxParticipants - event.participantCount, 0);

  const ended = hasEventEnded(event);

  const canChat = canAccessEventChat(
    event.myParticipationStatus,
    isOrganizer,
    event.conversationId,
    event.status,
  );

  const leaveLabel = event.isOnWaitlist
    ? "Listeden çık"
    : hasPendingParticipation(event.myParticipationStatus)
      ? "Başvuruyu geri çek"
      : "Ayrıl";

  const canLeave = hasJoined && !ended && !isOrganizer;

  const primaryLabel = isOrganizer
    ? canChat
      ? "Sohbet"
      : "Sen düzenliyorsun"
    : ended
      ? hasJoined
        ? "Etkinlik bitti"
        : "Katılım kapalı"
      : hasJoined
        ? leaveLabel
        : isFull
          ? "Etkinlik Dolu"
          : "Katıl";

  const primaryAction = isOrganizer
    ? canChat
      ? onChat
      : undefined
    : canLeave
      ? onLeave
      : ended || isFull || hasJoined
        ? undefined
        : onJoin;

  return (
    <View
      className="flex-row items-center gap-4 border-t border-white/10 bg-brand-secondary px-6 pt-4"
      style={{ paddingBottom: insets.bottom + 12 }}
    >
      <View>
        <Text className="font-mono text-lg text-brand-primary">
          {spotsLeft == null ? "∞" : spotsLeft}
        </Text>
        <Text className="font-body text-xs text-brand-neutral">yer kaldı</Text>
      </View>

      <View className="flex-1">
        <Button
          label={primaryLabel}
          size="lg"
          variant={hasJoined && !isOrganizer ? "outline" : "primary"}
          isLoading={isJoining || isLeaving}
          disabled={!primaryAction}
          onPress={primaryAction}
        />
      </View>
    </View>
  );
}
