import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Avatar } from "@/components";
import { themeColors, typeStyles } from "@/constants/theme";
import type { EventDetail } from "@/types/events";
import { canAccessEventChat } from "@/utils/events";
import { lightImpact } from "@/utils/haptics";

type EventOrganizerSectionProps = {
  event: EventDetail;
  isOrganizer: boolean;
  onOpenUser: (userId: string) => void;
  onChat: () => void;
};

export function EventOrganizerSection({
  event,
  isOrganizer,
  onOpenUser,
  onChat,
}: EventOrganizerSectionProps) {
  const profile = event.participants.find(
    (item) => item.userId === event.organizerUserId,
  );
  const avatarUrl = profile?.avatarUrl ?? null;
  const username = profile?.username?.trim() || null;
  const showChat =
    !isOrganizer &&
    canAccessEventChat(
      event.myParticipationStatus,
      isOrganizer,
      event.conversationId,
      event.status,
    );

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(120)}
      className="gap-md"
    >
      <Text style={[typeStyles.label, { color: themeColors.text.secondary }]}>
        Etkinlik Sahibi
      </Text>

      <View className="flex-row items-center gap-3">
        <Avatar
          uri={avatarUrl}
          name={event.hostName}
          size={44}
          borderWidth={0}
          onPress={() => {
            lightImpact();
            onOpenUser(event.organizerUserId);
          }}
          backgroundColor={themeColors.surface.secondary}
          textColor={themeColors.text.secondary}
        />

        <Pressable
          onPress={() => {
            lightImpact();
            onOpenUser(event.organizerUserId);
          }}
          className="min-w-0 flex-1"
        >
          <Text
            numberOfLines={1}
            className="font-body-bold text-[15px]"
            style={{ color: themeColors.text.primary }}
          >
            @{username || "sporcu"}
          </Text>
        </Pressable>

        {showChat ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sohbete git"
            hitSlop={8}
            onPress={() => {
              lightImpact();
              onChat();
            }}
            className="h-11 w-11 items-center justify-center rounded-full"
            style={{ backgroundColor: themeColors.surface.secondary }}
          >
            <FontAwesome6
              name="comment"
              size={15}
              color={themeColors.text.primary}
            />
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}
