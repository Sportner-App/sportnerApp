import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Button } from "@/components";
import { PARTICIPANT_STATUS, type EventDetail } from "@/types/events";
import { participantStatusLabel } from "@/utils/events";

type OrganizerPanelProps = {
  event: EventDetail;
  canManage: boolean;
  canComplete: boolean;
  canTakeAttendance: boolean;
  busyUserId: string | null;
  isMutating: boolean;
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
  onPromote: (userId: string) => void;
  onAttended: (userId: string) => void;
  onAbsent: (userId: string) => void;
  onCancel: () => void;
  onComplete: () => void;
  onEdit: () => void;
  onOpenUser: (userId: string) => void;
  onOpenReviews: () => void;
  onRateUser: (userId: string) => void;
};

export function OrganizerPanel({
  event,
  canManage,
  canComplete,
  canTakeAttendance,
  busyUserId,
  isMutating,
  onApprove,
  onReject,
  onPromote,
  onAttended,
  onAbsent,
  onCancel,
  onComplete,
  onEdit,
  onOpenUser,
  onOpenReviews,
  onRateUser,
}: OrganizerPanelProps) {
  const pending = event.participants.filter(
    (item) => item.status === PARTICIPANT_STATUS.pending,
  );
  const approved = event.participants.filter(
    (item) =>
      item.status === PARTICIPANT_STATUS.approved ||
      item.status === PARTICIPANT_STATUS.attended ||
      item.status === PARTICIPANT_STATUS.noShow,
  );

  return (
    <Animated.View
      entering={FadeInDown.duration(420).delay(80)}
      className="gap-4 rounded-3xl border border-brand-primary/25 bg-brand-surface/90 p-5"
    >
      <Text className="font-display text-base text-white">Organizatör</Text>

      {canManage ? (
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Button label="Düzenle" variant="outline" size="sm" onPress={onEdit} />
          </View>
          <View className="flex-1">
            <Button
              label="İptal et"
              variant="danger"
              size="sm"
              isLoading={isMutating}
              onPress={onCancel}
            />
          </View>
        </View>
      ) : null}

      {canComplete ? (
        <Button
          label="Etkinliği tamamla"
          size="sm"
          isLoading={isMutating}
          onPress={onComplete}
        />
      ) : null}

      {pending.length > 0 ? (
        <View className="gap-2">
          <Text className="font-body text-xs text-brand-neutral">
            Onay bekleyenler
          </Text>
          {pending.map((person) => (
            <View
              key={person.id}
              className="flex-row items-center gap-2 rounded-2xl border border-white/10 bg-brand-secondary/70 px-3 py-2.5"
            >
              <Pressable className="flex-1" onPress={() => onOpenUser(person.id)}>
                <Text className="font-body text-sm font-semibold text-white">
                  {person.name}
                </Text>
                <Text className="font-body text-xs text-brand-neutral">
                  {participantStatusLabel(person.status)}
                </Text>
              </Pressable>
              <Pressable
                disabled={busyUserId === person.id}
                onPress={() => onApprove(person.id)}
                className="rounded-full bg-brand-primary px-3 py-1.5"
              >
                <Text className="font-body text-xs font-semibold text-brand-secondary">
                  Onayla
                </Text>
              </Pressable>
              <Pressable
                disabled={busyUserId === person.id}
                onPress={() => onReject(person.id)}
                className="rounded-full border border-white/15 px-3 py-1.5"
              >
                <Text className="font-body text-xs text-brand-neutral">Reddet</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      {event.waitlist.length > 0 ? (
        <View className="gap-2">
          <Text className="font-body text-xs text-brand-neutral">
            Bekleme listesi
          </Text>
          {event.waitlist.map((entry) => (
            <View
              key={entry.userId}
              className="flex-row items-center gap-2 rounded-2xl border border-white/10 bg-brand-secondary/70 px-3 py-2.5"
            >
              <Pressable
                className="flex-1"
                onPress={() => onOpenUser(entry.userId)}
              >
                <Text className="font-body text-sm font-semibold text-white">
                  #{entry.position} {entry.name}
                </Text>
              </Pressable>
              <Pressable
                disabled={busyUserId === entry.userId}
                onPress={() => onPromote(entry.userId)}
                className="rounded-full bg-brand-primary px-3 py-1.5"
              >
                <Text className="font-body text-xs font-semibold text-brand-secondary">
                  Al
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      {canTakeAttendance ? (
        <View className="gap-2">
          <Text className="font-body text-xs text-brand-neutral">Yoklama</Text>
          {approved.map((person) => (
            <View
              key={person.id}
              className="flex-row items-center gap-2 rounded-2xl border border-white/10 bg-brand-secondary/70 px-3 py-2.5"
            >
              <View className="flex-1">
                <Text className="font-body text-sm font-semibold text-white">
                  {person.name}
                </Text>
                <Text className="font-body text-xs text-brand-neutral">
                  {participantStatusLabel(person.status)}
                </Text>
              </View>
              {person.status === PARTICIPANT_STATUS.approved ? (
                <>
                  <Pressable
                    onPress={() => onAttended(person.id)}
                    className="rounded-full bg-brand-primary px-3 py-1.5"
                  >
                    <Text className="font-body text-xs font-semibold text-brand-secondary">
                      Geldi
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => onAbsent(person.id)}
                    className="rounded-full border border-white/15 px-3 py-1.5"
                  >
                    <Text className="font-body text-xs text-brand-neutral">
                      Gelmedi
                    </Text>
                  </Pressable>
                </>
              ) : null}
              {person.status === PARTICIPANT_STATUS.attended ? (
                <Pressable
                  onPress={() => onRateUser(person.id)}
                  className="rounded-full bg-brand-primary px-3 py-1.5"
                >
                  <Text className="font-body text-xs font-semibold text-brand-secondary">
                    Puanla
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ))}
          <Button
            label="Katılımcıları değerlendir"
            variant="outline"
            size="sm"
            onPress={onOpenReviews}
          />
        </View>
      ) : null}
    </Animated.View>
  );
}
