import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { Button } from "@/components";
import { themeColors } from "@/constants/theme";
import type { IconName } from "@/types/components";
import type { EventDetail } from "@/types/events";
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
  const { t } = useTranslation("eventDetail");
  const [sheetTab, setSheetTab] = useState<OrganizerManageTab | null>(null);
  const hasWaitlist = event.waitlist.length > 0;

  const openSheet = (tab: OrganizerManageTab) => {
    lightImpact();
    setSheetTab(tab);
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(140)}
      className="gap-md"
    >
      {canManage ? (
        <View className="gap-sm">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("organizerPanel.editAccessibility")}
            onPress={() => {
              lightImpact();
              onEdit();
            }}
            className="min-h-[48px] flex-row items-center justify-center gap-2 rounded-large border border-border-strong bg-surface-primary px-4 active:bg-surface-secondary"
          >
            <FontAwesome6
              name="pen"
              size={12}
              color={themeColors.text.primary}
            />
            <Text
              className="font-body-bold text-sm"
              style={{ color: themeColors.text.primary }}
            >
              {t("organizerPanel.edit")}
            </Text>
          </Pressable>
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
            <Text
              className="font-body text-sm"
              style={{ color: themeColors.destructive }}
            >
              {isMutating
                ? t("organizerPanel.cancelling")
                : t("organizerPanel.cancelEvent")}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {hasWaitlist ? (
        <InboxRow
          icon="clock"
          title={t("organizerPanel.waitlistTitle")}
          subtitle={
            event.waitlist.length === 1
              ? t("organizerPanel.waitlistSubtitleOne")
              : t("organizerPanel.waitlistSubtitleMany", {
                  count: event.waitlist.length,
                })
          }
          badge={event.waitlist.length}
          onPress={() => openSheet("waitlist")}
        />
      ) : null}

      {canTakeAttendance ? (
        <InboxRow
          icon="clipboard-check"
          title={t("organizerPanel.attendanceTitle")}
          subtitle={t("organizerPanel.attendanceSubtitle")}
          onPress={() => openSheet("attendance")}
        />
      ) : null}

      {canTakeAttendance ? (
        <Button
          label={t("organizerPanel.rateParticipants")}
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
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: IconName;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-large py-2.5 active:opacity-80"
    >
      <View
        className="h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: themeColors.surface.secondary }}
      >
        <FontAwesome6
          name={icon}
          size={14}
          color={themeColors.text.secondary}
        />
      </View>

      <View className="flex-1">
        <Text
          className="font-body-bold text-sm"
          style={{ color: themeColors.text.primary }}
        >
          {title}
        </Text>
        <Text
          className="font-body text-caption"
          style={{ color: themeColors.text.secondary }}
        >
          {subtitle}
        </Text>
      </View>

      {badge != null ? (
        <View
          className="min-w-[22px] items-center rounded-full px-1.5 py-0.5"
          style={{ backgroundColor: themeColors.brand.primary }}
        >
          <Text
            className="font-body-bold text-[11px]"
            style={{ color: themeColors.text.onPrimary }}
          >
            {badge}
          </Text>
        </View>
      ) : null}

      <FontAwesome6
        name="chevron-right"
        size={12}
        color={themeColors.text.tertiary}
      />
    </Pressable>
  );
}
