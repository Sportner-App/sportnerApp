import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useMemo } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";

import {
  SPECIAL_FIELD_SPORTS,
  buildGridPoints,
  getSportLayout,
} from "@/features/events-detail/model/field-layout";
import {
  getInitials,
  getSkillLabel,
} from "@/features/events-detail/model/field-utils";
import type { ParticipantProfile } from "@/features/events-detail/model/types";
import { renderSportField } from "./event-field-visualization";

interface SlotAvatarProps {
  participant: ParticipantProfile;
  eventOwnerId: string;
}

function SlotAvatar({ participant, eventOwnerId }: SlotAvatarProps) {
  return (
    <View className="items-center">
      <View className="relative">
        {participant.avatarUrl ? (
          <Image
            source={{ uri: participant.avatarUrl }}
            className="h-14 w-14 rounded-full border-[2px] border-brand-primary"
          />
        ) : (
          <View className="h-14 w-14 items-center justify-center rounded-full border-[2px] border-brand-primary bg-brand-raised">
            <Text className="font-mono text-[12px] text-brand-primary">
              {getInitials(participant.fullName)}
            </Text>
          </View>
        )}

        {participant.userId === eventOwnerId ? (
          <View className="absolute -right-1 -top-2 rounded-full bg-brand-secondary px-1 py-0.5">
            <Text className="text-[10px]">👑</Text>
          </View>
        ) : null}
      </View>

      <Text
        numberOfLines={1}
        className="mt-1 w-[76px] text-center font-body text-[10px] text-white"
      >
        {participant.fullName}
      </Text>
      <Text className="w-[76px] text-center font-mono text-[9px] text-brand-neutral">
        {getSkillLabel(participant.skillLevel)}
      </Text>
    </View>
  );
}

interface EmptySlotProps {
  canRequestFromSlot: boolean;
  isActionLoading: boolean;
  onRequestToJoin: () => void;
  compact?: boolean;
}

function EmptySlot({
  canRequestFromSlot,
  isActionLoading,
  onRequestToJoin,
  compact,
}: EmptySlotProps) {
  return (
    <Pressable
      disabled={!canRequestFromSlot || isActionLoading}
      onPress={onRequestToJoin}
      className={`items-center ${
        canRequestFromSlot && !isActionLoading ? "opacity-100" : "opacity-70"
      }`}
    >
      <View
        className={`${compact ? "h-11 w-11" : "h-14 w-14"} items-center justify-center rounded-full border border-dashed border-brand-tertiary bg-brand-surface/70`}
      >
        <FontAwesome6 name="plus" size={compact ? 14 : 16} color="#94a3b8" />
      </View>
      <Text
        className={`mt-1 ${compact ? "w-[92px] text-[10px]" : "w-[76px] text-[10px]"} text-center font-body text-brand-neutral`}
      >
        {compact ? "Bos Kontenjan / + Katil" : "Bos Slot"}
      </Text>
    </Pressable>
  );
}

interface TacticalLineupProps {
  sportType: string;
  maxPlayers: number;
  approvedParticipants: ParticipantProfile[];
  eventOwnerId: string;
  isOrganizer: boolean;
  currentUserStatus: "pending" | "approved" | "rejected" | null;
  isActionLoading: boolean;
  onRequestToJoin: () => void;
}

export function TacticalLineup({
  sportType,
  maxPlayers,
  approvedParticipants,
  eventOwnerId,
  isOrganizer,
  currentUserStatus,
  isActionLoading,
  onRequestToJoin,
}: TacticalLineupProps) {
  const layout = useMemo(
    () => getSportLayout(sportType, maxPlayers),
    [maxPlayers, sportType],
  );

  const slotCount = Math.max(maxPlayers, 1);
  const canRequestFromSlot =
    !isOrganizer &&
    (currentUserStatus === null || currentUserStatus === "rejected");
  const isSpecialFieldSport = SPECIAL_FIELD_SPORTS.has(sportType);
  const gridPoints = useMemo(
    () => buildGridPoints(slotCount, layout.width, layout.height, 3),
    [layout.height, layout.width, slotCount],
  );

  if (!isSpecialFieldSport) {
    return (
      <View className="mt-3 overflow-hidden rounded-3xl border border-brand-tertiary bg-brand-raised/70">
        <View className="flex-row items-center justify-between border-b border-brand-tertiary px-4 py-3">
          <Text className="font-display text-base text-white">
            Slotlu Kadro Listesi
          </Text>
          <Text className="font-mono text-xs text-brand-primary">
            {approvedParticipants.length}/{slotCount}
          </Text>
        </View>

        <View className="gap-2 px-3 py-3">
          {Array.from({ length: slotCount }).map((_, index) => {
            const participant = approvedParticipants[index] ?? null;

            return (
              <View
                key={`slot-list-${index}`}
                className="flex-row items-center rounded-2xl border border-brand-tertiary bg-brand-surface px-3 py-3"
              >
                <View className="mr-3 h-8 min-w-[34px] items-center justify-center rounded-full border border-brand-tertiary bg-brand-raised px-2">
                  <Text className="font-mono text-[11px] text-brand-neutral">
                    #{index + 1}
                  </Text>
                </View>

                {participant ? (
                  <View className="flex-1 flex-row items-center gap-3">
                    <SlotAvatar
                      participant={participant}
                      eventOwnerId={eventOwnerId}
                    />
                  </View>
                ) : (
                  <View className="flex-1 items-start">
                    <EmptySlot
                      canRequestFromSlot={canRequestFromSlot}
                      isActionLoading={isActionLoading}
                      onRequestToJoin={onRequestToJoin}
                      compact
                    />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View className="mt-3 overflow-hidden rounded-3xl border border-brand-tertiary bg-brand-raised/70">
      <View className="flex-row items-center justify-between border-b border-brand-tertiary px-4 py-3">
        <Text className="font-display text-base text-white">
          Saha Ici Kadro
        </Text>
        <Text className="font-mono text-xs text-brand-primary">
          {approvedParticipants.length}/{slotCount}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-2 py-2"
      >
        <View
          className="relative overflow-hidden rounded-2xl bg-brand-surface"
          style={{ width: layout.width, height: layout.height }}
        >
          {renderSportField(sportType, layout.width, layout.height)}

          {Array.from({ length: slotCount }).map((_, index) => {
            const participant = approvedParticipants[index] ?? null;
            const point = layout.points[index] ?? gridPoints[index];

            return (
              <View
                key={`lineup-slot-${index}`}
                className="absolute"
                style={{ left: point.x - 34, top: point.y - 34, width: 68 }}
              >
                {participant ? (
                  <SlotAvatar
                    participant={participant}
                    eventOwnerId={eventOwnerId}
                  />
                ) : (
                  <EmptySlot
                    canRequestFromSlot={canRequestFromSlot}
                    isActionLoading={isActionLoading}
                    onRequestToJoin={onRequestToJoin}
                  />
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
