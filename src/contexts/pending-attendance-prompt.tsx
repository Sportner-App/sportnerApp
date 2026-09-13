import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { InteractionManager } from "react-native";
import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Avatar, BottomSheet, Button } from "@/components";
import { themeColors } from "@/constants/theme";
import {
  confirmAllAttendance,
  listPendingAttendanceEvents,
} from "@/services/events-service";
import type { PendingAttendanceEvent } from "@/types/events";

import { useAuth } from "./auth-context";
import { useToast } from "./toast-provider";

type Mode = "prompt" | "checklist";

/**
 * Reviews stay blocked for an event until every participant's attendance is confirmed, and
 * that's the organizer's call to make (see AttendanceConfirmation / ConfirmAllAttendance on the
 * backend). Rather than relying on the organizer to remember to go take attendance, this surfaces
 * the very next time they open the app after one of their events ends, with a one-tap default
 * ("everyone showed up") so closing it out never feels like a chore.
 *
 * Dismissible (X) — a background job still auto-confirms everyone a few days later regardless,
 * so nothing stays permanently blocked even if this gets skipped every time.
 */
export function PendingAttendancePrompt({ children }: PropsWithChildren) {
  const { t } = useTranslation("events");
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [queue, setQueue] = useState<PendingAttendanceEvent[]>([]);
  const [mode, setMode] = useState<Mode>("prompt");
  const [absentUserIds, setAbsentUserIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dismissedRef = useRef(false);

  const current = queue[0] ?? null;

  useEffect(() => {
    if (!isAuthenticated || dismissedRef.current) {
      return;
    }

    const task = InteractionManager.runAfterInteractions(() => {
      void listPendingAttendanceEvents()
        .then((events) => setQueue(events))
        .catch(() => undefined);
    });

    return () => task.cancel();
  }, [isAuthenticated]);

  const resetForNext = useCallback(() => {
    setMode("prompt");
    setAbsentUserIds(new Set());
    setQueue((prev) => prev.slice(1));
  }, []);

  const handleDismiss = () => {
    if (isSubmitting) {
      return;
    }
    dismissedRef.current = true;
    setQueue([]);
  };

  const toggleAbsent = (userId: string) => {
    setAbsentUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleConfirm = async (eventId: string, absentIds: string[]) => {
    if (isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await confirmAllAttendance(eventId, absentIds);
      if (error) {
        showToast({
          type: "error",
          title: t("pendingAttendance.failedTitle"),
          description: error.message,
        });
        return;
      }
      resetForNext();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {children}

      <BottomSheet
        visible={current != null}
        onClose={handleDismiss}
        showCancel={false}
        title={
          mode === "prompt"
            ? t("pendingAttendance.title", { title: current?.title ?? "" })
            : t("pendingAttendance.checklistTitle")
        }
        subtitle={
          mode === "prompt"
            ? t("pendingAttendance.subtitle")
            : t("pendingAttendance.checklistSubtitle")
        }
      >
        {current ? (
          mode === "prompt" ? (
            <View className="gap-3">
              <Button
                label={t("pendingAttendance.everyoneAttended")}
                isLoading={isSubmitting}
                disabled={isSubmitting}
                onPress={() => void handleConfirm(current.eventId, [])}
              />
              <Pressable
                onPress={() => setMode("checklist")}
                disabled={isSubmitting}
                className="items-center py-2"
              >
                <Text className="font-body text-sm font-semibold text-brand-primary">
                  {t("pendingAttendance.someoneAbsent")}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleDismiss}
                disabled={isSubmitting}
                className="items-center py-1"
              >
                <Text className="font-body text-xs text-text-secondary">
                  {t("pendingAttendance.later")}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View className="gap-3">
              <View className="gap-2">
                {current.participants.map((participant) => {
                  const isAbsent = absentUserIds.has(participant.userId);
                  return (
                    <Pressable
                      key={participant.userId}
                      onPress={() => toggleAbsent(participant.userId)}
                      className="flex-row items-center gap-3 rounded-2xl border border-border-default bg-surface-primary px-3 py-2.5 active:opacity-80"
                    >
                      <Avatar
                        uri={participant.avatarUrl}
                        name={participant.name}
                        size={36}
                      />
                      <Text
                        className="flex-1 font-body text-sm text-text-primary"
                        numberOfLines={1}
                      >
                        {participant.name}
                      </Text>
                      <FontAwesome6
                        name={isAbsent ? "circle" : "circle-check"}
                        size={20}
                        color={
                          isAbsent
                            ? themeColors.text.tertiary
                            : themeColors.brand.primary
                        }
                      />
                    </Pressable>
                  );
                })}
              </View>
              <Button
                label={t("pendingAttendance.confirm")}
                isLoading={isSubmitting}
                disabled={isSubmitting}
                onPress={() =>
                  void handleConfirm(current.eventId, [...absentUserIds])
                }
              />
            </View>
          )
        ) : null}
      </BottomSheet>
    </>
  );
}
