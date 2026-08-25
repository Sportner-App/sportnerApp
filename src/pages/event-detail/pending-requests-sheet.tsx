import { useEffect, useState, type ReactNode } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { BottomSheet, Button } from "@/components";
import {
  PARTICIPANT_STATUS,
  type EventDetail,
  type EventParticipant,
} from "@/types/events";
import {
  errorNotification,
  successNotification,
} from "@/utils/haptics";

type PendingRequestsSheetProps = {
  visible: boolean;
  event: EventDetail;
  busyUserId: string | null;
  onClose: () => void;
  onApprove: (userId: string) => Promise<boolean>;
  onReject: (userId: string) => Promise<boolean>;
  onOpenUser: (userId: string) => void;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function PendingRequestsSheet({
  visible,
  event,
  busyUserId,
  onClose,
  onApprove,
  onReject,
  onOpenUser,
}: PendingRequestsSheetProps) {
  const [busyKind, setBusyKind] = useState<"approve" | "reject" | null>(null);
  const [exiting, setExiting] = useState<EventParticipant[]>([]);

  useEffect(() => {
    if (!visible) {
      setExiting([]);
    }
  }, [visible]);

  const pending = event.participants.filter(
    (item) => item.status === PARTICIPANT_STATUS.pending,
  );
  const pendingIds = new Set(pending.map((item) => item.id));
  const exitingGone = exiting.filter((item) => !pendingIds.has(item.id));
  const rows = [...pending, ...exitingGone];

  const finishExit = (userId: string) => {
    setExiting((current) => current.filter((item) => item.id !== userId));
  };

  const approve = async (person: EventParticipant) => {
    if (busyUserId) {
      return;
    }
    setBusyKind("approve");
    try {
      const ok = await onApprove(person.id);
      if (!ok) {
        errorNotification();
        return;
      }
      successNotification();
      setExiting((current) => [...current, person]);
    } finally {
      setBusyKind(null);
    }
  };

  const reject = async (person: EventParticipant) => {
    if (busyUserId) {
      return;
    }
    setBusyKind("reject");
    try {
      const ok = await onReject(person.id);
      if (!ok) {
        errorNotification();
        return;
      }
      setExiting((current) => [...current, person]);
    } finally {
      setBusyKind(null);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Katılım İstekleri"
      subtitle="Etkinliğine katılmak isteyenleri değerlendir."
    >
      <ScrollView
        className="max-h-[420px]"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {rows.length === 0 ? (
          <EmptyState />
        ) : (
          <View className="gap-2">
            {rows.map((person) => {
              const isExiting = !pendingIds.has(person.id);
              const row = (
                <RequestRow
                  person={person}
                  busy={busyUserId === person.id}
                  busyKind={busyUserId === person.id ? busyKind : null}
                  onOpenUser={onOpenUser}
                  onApprove={() => approve(person)}
                  onReject={() => reject(person)}
                />
              );

              return isExiting ? (
                <ExitingRow
                  key={person.id}
                  onFinished={() => finishExit(person.id)}
                >
                  {row}
                </ExitingRow>
              ) : (
                <View key={person.id}>{row}</View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </BottomSheet>
  );
}

function ExitingRow({
  children,
  onFinished,
}: {
  children: ReactNode;
  onFinished: () => void;
}) {
  const progress = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(0, { duration: 160 }, (finished) => {
      if (finished) {
        runOnJS(onFinished)();
      }
    });
  }, [progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateX: (1 - progress.value) * 12 }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

function RequestRow({
  person,
  busy,
  busyKind,
  onOpenUser,
  onApprove,
  onReject,
}: {
  person: EventParticipant;
  busy: boolean;
  busyKind: "approve" | "reject" | null;
  onOpenUser: (userId: string) => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <View className="gap-3 rounded-2xl border border-white/10 bg-brand-secondary/70 p-3.5">
      <Pressable
        onPress={() => onOpenUser(person.id)}
        className="flex-row items-center gap-3 active:opacity-80"
      >
        <View className="h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-brand-primary/15">
          {person.avatarUrl ? (
            <Image source={{ uri: person.avatarUrl }} className="h-full w-full" />
          ) : (
            <Text className="font-body text-xs font-semibold text-brand-primary">
              {getInitials(person.name)}
            </Text>
          )}
        </View>
        <View className="flex-1">
          <Text className="font-body text-sm font-semibold text-white">
            {person.name}
          </Text>
          {person.username ? (
            <Text className="font-body text-xs text-brand-neutral">
              @{person.username}
            </Text>
          ) : null}
        </View>
      </Pressable>

      <View className="flex-row gap-2">
        <View className="flex-1">
          <Button
            label="Reddet"
            variant="secondary"
            size="sm"
            pressScale={0.96}
            haptic="light"
            isLoading={busy && busyKind === "reject"}
            disabled={busy}
            onPress={onReject}
          />
        </View>
        <View className="flex-1">
          <Button
            label="Onayla"
            size="sm"
            pressScale={0.96}
            haptic="light"
            isLoading={busy && busyKind === "approve"}
            disabled={busy}
            onPress={onApprove}
          />
        </View>
      </View>
    </View>
  );
}

function EmptyState() {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 200 });
  }, [progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 6 }],
  }));

  return (
    <Animated.View style={style} className="items-center gap-2 px-4 py-10">
      <Text className="text-center font-body text-sm font-semibold text-white">
        ✓ Tüm istekleri değerlendirdin
      </Text>
      <Text className="text-center font-body text-xs text-brand-neutral">
        Şimdilik bekleyen başka katılım isteği yok.
      </Text>
    </Animated.View>
  );
}
