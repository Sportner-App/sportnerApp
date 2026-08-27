import { Pressable, Text, View } from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Avatar } from "@/components";
import type { EventDetail, EventParticipant } from "@/types/events";
import { isCurrentParticipant } from "@/utils/events";
import { lightImpact } from "@/utils/haptics";

type ParticipantsCardProps = {
  event: EventDetail;
  onOpenUser?: (userId: string) => void;
  onOpenReviews?: () => void;
};

const VISIBLE_AVATAR_COUNT = 4;

function givenName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

function socialContext(people: EventParticipant[]) {
  if (people.length === 0) {
    return null;
  }

  const first = givenName(people[0].name);
  if (people.length === 1) {
    return `${first} katılıyor`;
  }

  const second = givenName(people[1].name);
  if (people.length === 2) {
    return `${first} ve ${second} katılıyor`;
  }

  return `${first}, ${second} ve ${people.length - 2} kişi daha`;
}

export function ParticipantsCard({
  event,
  onOpenUser,
  onOpenReviews,
}: ParticipantsCardProps) {
  const current = event.participants.filter((item) =>
    isCurrentParticipant(item.status),
  );
  const visible = current.slice(0, VISIBLE_AVATAR_COUNT);
  const remaining = current.length - visible.length;
  const rosterCount = current.length;
  const capacityLabel =
    event.maxParticipants == null
      ? `${rosterCount}`
      : `${rosterCount}/${event.maxParticipants}`;
  const fillRatio =
    event.maxParticipants == null || event.maxParticipants <= 0
      ? 0
      : Math.min(rosterCount / event.maxParticipants, 1);
  const context = socialContext(current);

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

      {current.length > 0 ? (
        <View className="gap-2.5">
          <View className="flex-row items-center">
            {visible.map((participant, index) => (
              <ParticipantAvatar
                key={participant.id}
                participant={participant}
                index={index}
                onPress={
                  onOpenUser && participant.userId && !participant.isGuest
                    ? () => onOpenUser(participant.userId!)
                    : undefined
                }
              />
            ))}

            {remaining > 0 ? (
              <View
                className="h-10 w-10 items-center justify-center rounded-full border-2 border-brand-surface bg-brand-primary/15"
                style={{ marginLeft: -10 }}
              >
                <Text className="font-mono text-[11px] text-brand-primary">
                  +{remaining}
                </Text>
              </View>
            ) : null}
          </View>

          {context ? (
            <Text className="font-body text-xs text-brand-neutral">
              {context}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <View
          className="h-full rounded-full bg-brand-primary"
          style={{ width: `${fillRatio * 100}%` }}
        />
      </View>

      {onOpenReviews ? (
        <Pressable
          onPress={onOpenReviews}
          className="items-center rounded-2xl border border-white/10 py-2.5"
        >
          <Text className="font-body text-xs font-semibold text-white">
            Değerlendirmeler
          </Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ParticipantAvatar({
  participant,
  index,
  onPress,
}: {
  participant: EventParticipant;
  index: number;
  onPress?: () => void;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const content = (
    <Avatar
      uri={participant.avatarUrl}
      name={participant.name}
      isGuest={participant.isGuest}
      size={36}
      borderWidth={0}
    />
  );

  if (!onPress) {
    return (
      <View
        className="h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-brand-surface bg-brand-raised"
        style={{ marginLeft: index === 0 ? 0 : -10 }}
      >
        {content}
      </View>
    );
  }

  return (
    <AnimatedPressable
      onPress={() => {
        lightImpact();
        onPress();
      }}
      onPressIn={() => {
        scale.value = withTiming(0.94, { duration: 90 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 90 });
      }}
      style={[style, { marginLeft: index === 0 ? 0 : -10 }]}
      className="h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-brand-surface bg-brand-raised"
    >
      {content}
    </AnimatedPressable>
  );
}
