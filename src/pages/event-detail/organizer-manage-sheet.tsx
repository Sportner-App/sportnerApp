import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { BottomSheet, Button, SegmentedTabs } from "@/components";
import {
  PARTICIPANT_STATUS,
  type EventDetail,
  type EventParticipant,
  type EventWaitlistEntry,
} from "@/types/events";
import { participantStatusLabel } from "@/utils/events";

export type OrganizerManageTab = "requests" | "waitlist" | "attendance";

type OrganizerManageSheetProps = {
  visible: boolean;
  initialTab: OrganizerManageTab;
  event: EventDetail;
  canTakeAttendance: boolean;
  busyUserId: string | null;
  onClose: () => void;
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
  onPromote: (userId: string) => void;
  onAttended: (userId: string) => void;
  onAbsent: (userId: string) => void;
  onOpenUser: (userId: string) => void;
  onRateUser: (userId: string) => void;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function tabCopy(tab: OrganizerManageTab, count: number) {
  switch (tab) {
    case "requests":
      return {
        title: "Katılım istekleri",
        subtitle:
          count > 0
            ? `${count} kişi onay bekliyor. Onayladığın kişiler katılımcılara eklenir.`
            : "Yanıtlanacak istek kalmadı.",
      };
    case "waitlist":
      return {
        title: "Bekleme listesi",
        subtitle:
          count > 0
            ? `${count} kişi yer açılmasını bekliyor.`
            : "Bekleme listesi boş.",
      };
    case "attendance":
      return {
        title: "Yoklama",
        subtitle: "Kim geldi, kim gelmedi — sonra gelenleri puanlayabilirsin.",
      };
  }
}

export function OrganizerManageSheet({
  visible,
  initialTab,
  event,
  canTakeAttendance,
  busyUserId,
  onClose,
  onApprove,
  onReject,
  onPromote,
  onAttended,
  onAbsent,
  onOpenUser,
  onRateUser,
}: OrganizerManageSheetProps) {
  const [tab, setTab] = useState<OrganizerManageTab>(initialTab);

  const pending = event.participants.filter(
    (item) => item.status === PARTICIPANT_STATUS.pending,
  );
  const approved = event.participants.filter(
    (item) =>
      item.status === PARTICIPANT_STATUS.approved ||
      item.status === PARTICIPANT_STATUS.attended ||
      item.status === PARTICIPANT_STATUS.noShow,
  );

  const options = useMemo(() => {
    const items: { key: OrganizerManageTab; label: string }[] = [];

    if (pending.length > 0 || tab === "requests") {
      items.push({
        key: "requests",
        label:
          pending.length > 0 ? `İstekler (${pending.length})` : "İstekler",
      });
    }

    if (event.waitlist.length > 0 || tab === "waitlist") {
      items.push({
        key: "waitlist",
        label:
          event.waitlist.length > 0
            ? `Bekleme (${event.waitlist.length})`
            : "Bekleme",
      });
    }

    if (canTakeAttendance) {
      items.push({ key: "attendance", label: "Yoklama" });
    }

    return items;
  }, [canTakeAttendance, event.waitlist.length, pending.length, tab]);

  useEffect(() => {
    if (visible) {
      setTab(initialTab);
    }
  }, [initialTab, visible]);

  const count =
    tab === "requests"
      ? pending.length
      : tab === "waitlist"
        ? event.waitlist.length
        : approved.length;
  const copy = tabCopy(tab, count);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={copy.title}
      subtitle={copy.subtitle}
    >
      {options.length > 1 ? (
        <View className="mb-3">
          <SegmentedTabs
            options={options}
            value={tab}
            onChange={setTab}
            indicatorMotion="timing"
          />
        </View>
      ) : null}

      <ScrollView
        className="max-h-[420px]"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {tab === "requests" ? (
          <RequestList
            people={pending}
            busyUserId={busyUserId}
            onOpenUser={onOpenUser}
            onApprove={onApprove}
            onReject={onReject}
          />
        ) : null}

        {tab === "waitlist" ? (
          <WaitlistList
            entries={event.waitlist}
            busyUserId={busyUserId}
            onOpenUser={onOpenUser}
            onPromote={onPromote}
          />
        ) : null}

        {tab === "attendance" ? (
          <AttendanceList
            people={approved}
            busyUserId={busyUserId}
            onOpenUser={onOpenUser}
            onAttended={onAttended}
            onAbsent={onAbsent}
            onRateUser={onRateUser}
          />
        ) : null}
      </ScrollView>
    </BottomSheet>
  );
}

function PersonHeader({
  name,
  detail,
  onPress,
}: {
  name: string;
  detail: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 active:opacity-80"
    >
      <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-primary/15">
        <Text className="font-body text-xs font-semibold text-brand-primary">
          {getInitials(name)}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="font-body text-sm font-semibold text-white">
          {name}
        </Text>
        <Text className="font-body text-xs text-brand-neutral">{detail}</Text>
      </View>
    </Pressable>
  );
}

function RequestList({
  people,
  busyUserId,
  onOpenUser,
  onApprove,
  onReject,
}: {
  people: EventParticipant[];
  busyUserId: string | null;
  onOpenUser: (userId: string) => void;
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
}) {
  if (people.length === 0) {
    return <EmptyState text="Onay bekleyen kimse yok." />;
  }

  return (
    <View className="gap-2">
      {people.map((person) => {
        const busy = busyUserId === person.id;
        return (
          <View
            key={person.id}
            className="gap-3 rounded-2xl border border-white/10 bg-brand-secondary/70 p-3.5"
          >
            <PersonHeader
              name={person.name}
              detail={
                person.username
                  ? `@${person.username}`
                  : participantStatusLabel(person.status)
              }
              onPress={() => onOpenUser(person.id)}
            />
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Button
                  label="Onayla"
                  size="sm"
                  haptic="success"
                  isLoading={busy}
                  disabled={busyUserId != null}
                  onPress={() => onApprove(person.id)}
                />
              </View>
              <View className="flex-1">
                  <Button
                    label="Reddet"
                    variant="secondary"
                    size="sm"
                    haptic="light"
                    disabled={busyUserId != null}
                    onPress={() => onReject(person.id)}
                  />
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function WaitlistList({
  entries,
  busyUserId,
  onOpenUser,
  onPromote,
}: {
  entries: EventWaitlistEntry[];
  busyUserId: string | null;
  onOpenUser: (userId: string) => void;
  onPromote: (userId: string) => void;
}) {
  if (entries.length === 0) {
    return <EmptyState text="Bekleme listesi boş." />;
  }

  return (
    <View className="gap-2">
      {entries.map((entry) => {
        const busy = busyUserId === entry.userId;
        return (
          <View
            key={entry.userId}
            className="gap-3 rounded-2xl border border-white/10 bg-brand-secondary/70 p-3.5"
          >
            <PersonHeader
              name={entry.name}
              detail={
                entry.username
                  ? `#${entry.position} · @${entry.username}`
                  : `#${entry.position} sırada`
              }
              onPress={() => onOpenUser(entry.userId)}
            />
            <Button
              label="Listeye al"
              size="sm"
              haptic="success"
              isLoading={busy}
              disabled={busyUserId != null}
              onPress={() => onPromote(entry.userId)}
            />
          </View>
        );
      })}
    </View>
  );
}

function AttendanceList({
  people,
  busyUserId,
  onOpenUser,
  onAttended,
  onAbsent,
  onRateUser,
}: {
  people: EventParticipant[];
  busyUserId: string | null;
  onOpenUser: (userId: string) => void;
  onAttended: (userId: string) => void;
  onAbsent: (userId: string) => void;
  onRateUser: (userId: string) => void;
}) {
  if (people.length === 0) {
    return <EmptyState text="Yoklama alınacak katılımcı yok." />;
  }

  return (
    <View className="gap-2">
      {people.map((person) => {
        const busy = busyUserId === person.id;
        return (
          <View
            key={person.id}
            className="gap-3 rounded-2xl border border-white/10 bg-brand-secondary/70 p-3.5"
          >
            <PersonHeader
              name={person.name}
              detail={participantStatusLabel(person.status)}
              onPress={() => onOpenUser(person.id)}
            />
            {person.status === PARTICIPANT_STATUS.approved ? (
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Button
                    label="Geldi"
                    size="sm"
                    haptic="success"
                    isLoading={busy}
                    disabled={busyUserId != null}
                    onPress={() => onAttended(person.id)}
                  />
                </View>
                <View className="flex-1">
                    <Button
                    label="Gelmedi"
                    variant="secondary"
                    size="sm"
                    haptic="light"
                    disabled={busyUserId != null}
                    onPress={() => onAbsent(person.id)}
                  />
                </View>
              </View>
            ) : null}
            {person.status === PARTICIPANT_STATUS.attended ? (
              <Button
                label="Puanla"
                size="sm"
                haptic="light"
                onPress={() => onRateUser(person.id)}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <View className="items-center px-4 py-10">
      <Text className="text-center font-body text-sm text-brand-neutral">
        {text}
      </Text>
    </View>
  );
}
