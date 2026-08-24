import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components";
import { EVENT_STATUS, type EventDetail } from "@/types/events";
import { canAccessEventChat, hasPendingParticipation } from "@/utils/events";

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

  const ended =
    event.status === EVENT_STATUS.cancelled ||
    event.status === EVENT_STATUS.completed;

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

  const primaryLabel = isOrganizer
    ? canChat
      ? "Sohbet"
      : "Sen düzenliyorsun"
    : hasJoined
      ? leaveLabel
      : isFull
        ? "Etkinlik Dolu"
        : ended
          ? "Katılım kapalı"
          : "Katıl";

  const primaryAction = isOrganizer
    ? canChat
      ? onChat
      : undefined
    : hasJoined
      ? onLeave
      : ended || isFull
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
