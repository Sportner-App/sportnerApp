import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Avatar } from "@/components";
import { themeColors } from "@/constants/theme";
import type { EventDetail } from "@/types/events";
import { isCurrentParticipant } from "@/utils/events";
import { lightImpact } from "@/utils/haptics";

type EventParticipantsTabProps = {
  event: EventDetail;
  pendingCount: number;
  onOpenPendingRequests: () => void;
  onOpenUser: (userId: string) => void;
};

export function EventParticipantsTab({
  event,
  pendingCount,
  onOpenPendingRequests,
  onOpenUser,
}: EventParticipantsTabProps) {
  const { t } = useTranslation("eventDetail");
  const participants = event.participants.filter((participant) =>
    isCurrentParticipant(participant.status),
  );

  return (
    <View className="gap-4">
      {pendingCount > 0 ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            lightImpact();
            onOpenPendingRequests();
          }}
          className="flex-row items-center gap-3 rounded-3xl border border-brand-primary/35 bg-brand-primary/10 p-4 active:opacity-75"
        >
          <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-primary">
            <FontAwesome6
              name="user-clock"
              size={14}
              color={themeColors.text.onPrimary}
            />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="font-body-bold text-sm text-text-primary">
              {t("participantTab.pendingTitle", { count: pendingCount })}
            </Text>
            <Text className="mt-0.5 font-body text-xs text-text-secondary">
              {t("participantTab.pendingSubtitle")}
            </Text>
          </View>
          <FontAwesome6
            name="chevron-right"
            size={11}
            color={themeColors.brand.primary}
          />
        </Pressable>
      ) : null}

      <View className="overflow-hidden rounded-3xl border border-border-default bg-background-secondary">
        <View className="flex-row items-center justify-between border-b border-border-default px-4 py-3.5">
          <Text className="font-body-bold text-base text-text-primary">
            {t("participantTab.heading")}
          </Text>
          <Text className="font-mono text-xs text-text-secondary">
            {t("participantTab.count", { count: participants.length })}
          </Text>
        </View>

        {participants.length === 0 ? (
          <View className="items-center gap-2 px-5 py-10">
            <FontAwesome6
              name="user-group"
              size={20}
              color={themeColors.text.tertiary}
            />
            <Text className="text-center font-body text-sm text-text-secondary">
              {t("participantTab.empty")}
            </Text>
          </View>
        ) : (
          participants.map((participant, index) => (
            <Pressable
              key={participant.id}
              disabled={!participant.userId}
              onPress={() => {
                if (!participant.userId) return;
                lightImpact();
                onOpenUser(participant.userId);
              }}
              className={`flex-row items-center gap-3 px-4 py-3.5 active:bg-surface-secondary ${
                index < participants.length - 1
                  ? "border-b border-border-default"
                  : ""
              }`}
            >
              <Avatar
                uri={participant.avatarUrl}
                name={participant.name}
                isGuest={participant.isGuest}
                size={44}
                borderWidth={0}
                previewable={false}
              />
              <View className="min-w-0 flex-1">
                <Text
                  numberOfLines={1}
                  className="font-body-bold text-sm text-text-primary"
                >
                  {participant.name}
                </Text>
                <Text className="mt-0.5 font-body text-xs text-text-secondary">
                  {participant.isGuest
                    ? t("participantTab.guest")
                    : participant.username
                      ? `@${participant.username}`
                      : t("participantTab.member")}
                </Text>
              </View>
              {participant.userId ? (
                <FontAwesome6
                  name="chevron-right"
                  size={10}
                  color={themeColors.text.tertiary}
                />
              ) : null}
            </Pressable>
          ))
        )}
      </View>
    </View>
  );
}
