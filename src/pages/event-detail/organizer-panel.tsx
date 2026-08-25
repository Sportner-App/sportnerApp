import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Button } from "@/components";
import type { EventDetail } from "@/types/events";
import type { IconName } from "@/types/components";
import { lightImpact } from "@/utils/haptics";

import {
  OrganizerManageSheet,
  type OrganizerManageTab,
} from "./organizer-manage-sheet";

type OrganizerPanelProps = {
  event: EventDetail;
  canManage: boolean;
  canTakeAttendance: boolean;
  busyUserId: string | null;
  isMutating: boolean;
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
  onPromote: (userId: string) => void;
  onAttended: (userId: string) => void;
  onAbsent: (userId: string) => void;
  onCancel: () => void;
  onEdit: () => void;
  onOpenUser: (userId: string) => void;
  onOpenReviews: () => void;
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

export function OrganizerPanel({
  event,
  canManage,
  canTakeAttendance,
  busyUserId,
  isMutating,
  onApprove,
  onReject,
  onPromote,
  onAttended,
  onAbsent,
  onCancel,
  onEdit,
  onOpenUser,
  onOpenReviews,
  onRateUser,
}: OrganizerPanelProps) {
  const [sheetTab, setSheetTab] = useState<OrganizerManageTab | null>(null);
  const hasWaitlist = event.waitlist.length > 0;

  const openSheet = (tab: OrganizerManageTab) => {
    lightImpact();
    setSheetTab(tab);
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(420).delay(80)}
      className="gap-4 rounded-3xl border border-brand-primary/25 bg-brand-surface/90 p-5"
    >
      <Text className="font-display text-base text-white">Etkinlik Yönetimi</Text>

      {canManage ? (
        <View className="gap-2">
          <Button
            label="Düzenle"
            variant="outline"
            size="sm"
            pressScale={0.98}
            haptic="light"
            onPress={onEdit}
          />
          <Pressable
            onPress={() => {
              if (isMutating) {
                return;
              }
              lightImpact();
              onCancel();
            }}
            disabled={isMutating}
            className="items-center py-2 active:opacity-70"
          >
            <Text className="font-body text-sm text-[#ef4444]">
              {isMutating ? "İptal ediliyor..." : "Etkinliği iptal et"}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {hasWaitlist ? (
        <InboxRow
          icon="clock"
          title="Bekleme listesi"
          subtitle={
            event.waitlist.length === 1
              ? "1 kişi yer bekliyor"
              : `${event.waitlist.length} kişi yer bekliyor`
          }
          badge={event.waitlist.length}
          onPress={() => openSheet("waitlist")}
        />
      ) : null}

      {canTakeAttendance ? (
        <InboxRow
          icon="clipboard-check"
          title="Yoklama"
          subtitle="Kim geldi, kim gelmedi"
          onPress={() => openSheet("attendance")}
        />
      ) : null}

      {canTakeAttendance ? (
        <Button
          label="Katılımcıları değerlendir"
          variant="outline"
          size="sm"
          onPress={onOpenReviews}
        />
      ) : null}

      <OrganizerManageSheet
        visible={sheetTab != null}
        initialTab={sheetTab ?? "requests"}
        event={event}
        canTakeAttendance={canTakeAttendance}
        busyUserId={busyUserId}
        onClose={() => setSheetTab(null)}
        onApprove={onApprove}
        onReject={onReject}
        onPromote={onPromote}
        onAttended={onAttended}
        onAbsent={onAbsent}
        onOpenUser={(userId) => {
          setSheetTab(null);
          onOpenUser(userId);
        }}
        onRateUser={(userId) => {
          setSheetTab(null);
          onRateUser(userId);
        }}
      />
    </Animated.View>
  );
}

function InboxRow({
  title,
  subtitle,
  icon,
  badge,
  names,
  accent = false,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: IconName;
  badge?: number;
  names?: string[];
  accent?: boolean;
  onPress: () => void;
}) {
  const preview = names?.slice(0, 3) ?? [];

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 rounded-2xl border px-3.5 py-3 active:opacity-80 ${
        accent
          ? "border-brand-primary/40 bg-brand-primary/10"
          : "border-white/10 bg-brand-secondary/70"
      }`}
    >
      {preview.length > 0 ? (
        <View className="flex-row">
          {preview.map((name, index) => (
            <View
              key={`${name}-${index}`}
              className="h-10 w-10 items-center justify-center rounded-full border-2 border-brand-surface bg-brand-primary/20"
              style={{ marginLeft: index === 0 ? 0 : -8 }}
            >
              <Text className="font-body text-[10px] font-semibold text-brand-primary">
                {getInitials(name)}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-primary/15">
          <FontAwesome6 name={icon} size={14} color="#ccff00" />
        </View>
      )}

      <View className="flex-1">
        <Text className="font-body text-sm font-semibold text-white">
          {title}
        </Text>
        <Text className="font-body text-xs text-brand-neutral">{subtitle}</Text>
      </View>

      {badge != null ? (
        <View className="min-w-[22px] items-center rounded-full bg-brand-primary px-1.5 py-0.5">
          <Text className="font-mono text-[11px] font-semibold text-brand-secondary">
            {badge}
          </Text>
        </View>
      ) : null}

      <FontAwesome6 name="chevron-right" size={12} color="#64748b" />
    </Pressable>
  );
}
