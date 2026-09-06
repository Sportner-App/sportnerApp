import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { Avatar, BottomSheet, Button, SegmentedTabs } from "@/components";
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

function tabCopy(
  t: TFunction<"eventDetail">,
  tab: OrganizerManageTab,
  count: number,
) {
  switch (tab) {
    case "requests":
      return {
        title: t("manageSheet.requestsTitle"),
        subtitle:
          count > 0
            ? t("manageSheet.requestsSubtitlePending", { count })
            : t("manageSheet.requestsSubtitleEmpty"),
      };
    case "waitlist":
      return {
        title: t("manageSheet.waitlistTitle"),
        subtitle:
          count > 0
            ? t("manageSheet.waitlistSubtitlePending", { count })
            : t("manageSheet.waitlistSubtitleEmpty"),
      };
    case "attendance":
      return {
        title: t("manageSheet.attendanceTitle"),
        subtitle: t("manageSheet.attendanceSubtitle"),
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
  const { t } = useTranslation("eventDetail");
  const [tab, setTab] = useState<OrganizerManageTab>(initialTab);

  const pending = event.participants.filter(
    (item) =>
      !item.isGuest &&
      item.userId != null &&
      item.status === PARTICIPANT_STATUS.pending,
  );
  const approved = event.participants.filter(
    (item) =>
      !item.isGuest &&
      item.userId != null &&
      (item.status === PARTICIPANT_STATUS.approved ||
        item.status === PARTICIPANT_STATUS.attended ||
        item.status === PARTICIPANT_STATUS.noShow),
  );

  const options = useMemo(() => {
    const items: { key: OrganizerManageTab; label: string }[] = [];

    if (pending.length > 0 || tab === "requests") {
      items.push({
        key: "requests",
        label:
          pending.length > 0
            ? t("manageSheet.requestsTabWithCount", { count: pending.length })
            : t("manageSheet.requestsTab"),
      });
    }

    if (event.waitlist.length > 0 || tab === "waitlist") {
      items.push({
        key: "waitlist",
        label:
          event.waitlist.length > 0
            ? t("manageSheet.waitlistTabWithCount", {
                count: event.waitlist.length,
              })
            : t("manageSheet.waitlistTab"),
      });
    }

    if (canTakeAttendance) {
      items.push({ key: "attendance", label: t("manageSheet.attendanceTab") });
    }

    return items;
  }, [canTakeAttendance, event.waitlist.length, pending.length, t, tab]);

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
  const copy = tabCopy(t, tab, count);

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
  profileImageUrl,
  onPress,
}: {
  name: string;
  detail: string;
  profileImageUrl?: string | null;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 active:opacity-80"
    >
      <Avatar uri={profileImageUrl} name={name} size={44} />
      <View className="flex-1">
        <Text className="font-body text-sm font-semibold text-text-primary">
          {name}
        </Text>
        <Text className="font-body text-xs text-text-secondary">{detail}</Text>
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
  const { t } = useTranslation("eventDetail");

  if (people.length === 0) {
    return <EmptyState text={t("manageSheet.noPendingRequests")} />;
  }

  return (
    <View className="gap-2">
      {people.map((person) => {
        const userId = person.userId!;
        const busy = busyUserId === userId;
        return (
          <View
            key={person.id}
            className="gap-3 rounded-2xl border border-border-default bg-surface-primary p-3.5"
          >
            <PersonHeader
              name={`@${person.username || t("events:fallback.athleteHandle")}`}
              profileImageUrl={person.avatarUrl}
              detail={participantStatusLabel(person.status)}
              onPress={() => onOpenUser(userId)}
            />
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Button
                  label={t("manageSheet.approve")}
                  size="sm"
                  haptic="success"
                  isLoading={busy}
                  disabled={busyUserId != null}
                  onPress={() => onApprove(userId)}
                />
              </View>
              <View className="flex-1">
                <Button
                  label={t("manageSheet.reject")}
                  variant="secondary"
                  size="sm"
                  haptic="light"
                  disabled={busyUserId != null}
                  onPress={() => onReject(userId)}
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
  const { t } = useTranslation("eventDetail");

  if (entries.length === 0) {
    return <EmptyState text={t("manageSheet.emptyWaitlist")} />;
  }

  return (
    <View className="gap-2">
      {entries.map((entry) => {
        const busy = busyUserId === entry.userId;
        return (
          <View
            key={entry.userId}
            className="gap-3 rounded-2xl border border-border-default bg-surface-primary p-3.5"
          >
            <PersonHeader
              name={`@${entry.username || t("events:fallback.athleteHandle")}`}
              profileImageUrl={entry.avatarUrl}
              detail={
                entry.username
                  ? `#${entry.position} · @${entry.username}`
                  : `#${entry.position} ${t("manageSheet.positionSuffix")}`
              }
              onPress={() => onOpenUser(entry.userId)}
            />
            <Button
              label={t("manageSheet.promote")}
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
  const { t } = useTranslation("eventDetail");

  if (people.length === 0) {
    return <EmptyState text={t("manageSheet.noAttendance")} />;
  }

  return (
    <View className="gap-2">
      {people.map((person) => {
        const userId = person.userId!;
        const busy = busyUserId === userId;
        return (
          <View
            key={person.id}
            className="gap-3 rounded-2xl border border-border-default bg-surface-primary p-3.5"
          >
            <PersonHeader
              name={`@${person.username || t("events:fallback.athleteHandle")}`}
              profileImageUrl={person.avatarUrl}
              detail={participantStatusLabel(person.status)}
              onPress={() => onOpenUser(userId)}
            />
            {person.status === PARTICIPANT_STATUS.approved ? (
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Button
                    label={t("manageSheet.attended")}
                    size="sm"
                    haptic="success"
                    isLoading={busy}
                    disabled={busyUserId != null}
                    onPress={() => onAttended(userId)}
                  />
                </View>
                <View className="flex-1">
                  <Button
                    label={t("manageSheet.absent")}
                    variant="secondary"
                    size="sm"
                    haptic="light"
                    disabled={busyUserId != null}
                    onPress={() => onAbsent(userId)}
                  />
                </View>
              </View>
            ) : null}
            {person.status === PARTICIPANT_STATUS.attended ? (
              <Button
                label={t("manageSheet.rate")}
                size="sm"
                haptic="light"
                onPress={() => onRateUser(userId)}
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
      <Text className="text-center font-body text-sm text-text-secondary">
        {text}
      </Text>
    </View>
  );
}
