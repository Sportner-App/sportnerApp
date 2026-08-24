import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import type { EventDetail } from "@/types/events";
import { isCurrentParticipant } from "@/utils/events";

type ParticipantsCardProps = {
  event: EventDetail;
  onOpenUser?: (userId: string) => void;
  onOpenChat?: () => void;
  onOpenReviews?: () => void;
};

const VISIBLE_AVATAR_COUNT = 6;

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ParticipantsCard({
  event,
  onOpenUser,
  onOpenChat,
  onOpenReviews,
}: ParticipantsCardProps) {
  const current = event.participants.filter((item) =>
    isCurrentParticipant(item.status),
  );
  const visible = current.slice(0, VISIBLE_AVATAR_COUNT);
  const remaining = current.length - visible.length;
  const capacityLabel =
    event.maxParticipants == null
      ? `${event.participantCount}`
      : `${event.participantCount}/${event.maxParticipants}`;
  const fillRatio =
    event.maxParticipants == null || event.maxParticipants <= 0
      ? 0
      : Math.min(event.participantCount / event.maxParticipants, 1);

  return (
    <Animated.View
      entering={FadeInDown.duration(500).delay(220)}
      className="gap-4 rounded-3xl border border-white/10 bg-brand-surface/90 p-5"
    >
      <View className="flex-row items-center justify-between">
        <Text className="font-display text-base text-white">Katılımcılar</Text>
        <Text className="font-mono text-xs text-brand-primary">
          {capacityLabel}
        </Text>
      </View>

      <View className="flex-row items-center">
        {visible.map((participant, index) => (
          <Pressable
            key={participant.id}
            onPress={() => onOpenUser?.(participant.id)}
            className="h-10 w-10 items-center justify-center rounded-full border-2 border-brand-surface bg-brand-raised"
            style={{ marginLeft: index === 0 ? 0 : -10 }}
          >
            <Text className="font-body text-xs font-semibold text-brand-primary">
              {getInitials(participant.name)}
            </Text>
          </Pressable>
        ))}

        {remaining > 0 && (
          <View
            className="h-10 w-10 items-center justify-center rounded-full border-2 border-brand-surface bg-brand-primary/15"
            style={{ marginLeft: -10 }}
          >
            <Text className="font-mono text-[11px] text-brand-primary">
              +{remaining}
            </Text>
          </View>
        )}
      </View>

      {/* Doluluk çizgisi */}
      <View className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <View
          className="h-full rounded-full bg-brand-primary"
          style={{ width: `${fillRatio * 100}%` }}
        />
      </View>

      {onOpenChat || onOpenReviews ? (
        <View className="flex-row gap-2">
          {onOpenChat ? (
            <Pressable
              onPress={onOpenChat}
              className="flex-1 items-center rounded-2xl border border-white/10 py-2.5"
            >
              <Text className="font-body text-xs font-semibold text-white">
                Sohbet
              </Text>
            </Pressable>
          ) : null}
          {onOpenReviews ? (
            <Pressable
              onPress={onOpenReviews}
              className="flex-1 items-center rounded-2xl border border-white/10 py-2.5"
            >
              <Text className="font-body text-xs font-semibold text-white">
                Değerlendirmeler
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </Animated.View>
  );
}
