import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useSession, useToast } from "@/contexts";
import {
  acceptEventInvitation,
  approveParticipant,
  cancelEvent,
  cancelParticipation,
  completeEvent,
  confirmAttendance,
  getEventById,
  joinEvent,
  markNoShow,
  promoteFromWaitlist,
  rejectParticipant,
  declineEventInvitation,
} from "@/services/events-service";
import { EVENT_STATUS, type EventDetail } from "@/types/events";
import {
  hasActiveParticipation,
  hasEventEnded,
  hasPendingParticipation,
} from "@/utils/events";
import { errorNotification, successNotification } from "@/utils/haptics";

export function useEventDetail(id: string | undefined) {
  const { t } = useTranslation("eventDetail");
  const { user } = useSession();
  const { showToast } = useToast();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isRespondingInvitation, setIsRespondingInvitation] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (mode: "initial" | "refresh") => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      if (mode === "initial") {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        setError(null);
        setEvent(await getEventById(id));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : t("toast.detailLoadFailed"),
        );
        setEvent(null);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [id, t],
  );

  const refresh = useCallback(() => load("refresh"), [load]);

  const hasLoadedRef = useRef(false);
  const lastIdRef = useRef(id);

  useFocusEffect(
    useCallback(() => {
      if (lastIdRef.current !== id) {
        lastIdRef.current = id;
        hasLoadedRef.current = false;
      }
      void load(hasLoadedRef.current ? "refresh" : "initial").finally(() => {
        hasLoadedRef.current = true;
      });
    }, [id, load]),
  );

  const hasJoined = hasActiveParticipation(
    event?.myParticipationStatus,
    event?.isOnWaitlist,
  );

  const isOrganizer = Boolean(
    event && user?.id && event.organizerUserId === user.id,
  );

  const isFull =
    event?.maxParticipants != null &&
    event.participantCount >= event.maxParticipants;

  const canManage =
    isOrganizer &&
    event != null &&
    (event.status === EVENT_STATUS.published ||
      event.status === EVENT_STATUS.full ||
      event.status === EVENT_STATUS.draft);

  const canComplete =
    isOrganizer &&
    event != null &&
    (event.status === EVENT_STATUS.published ||
      event.status === EVENT_STATUS.full) &&
    new Date(event.eventDate).getTime() + event.durationMinutes * 60_000 <=
      Date.now();

  const canTakeAttendance =
    isOrganizer && event?.status === EVENT_STATUS.completed;

  const canCancel =
    event?.canCancel === true &&
    event.status !== EVENT_STATUS.cancelled &&
    event.status !== EVENT_STATUS.completed;

  const runAction = async (
    action: () => Promise<{ error: { message: string } | null }>,
    successTitle: string,
    successDescription?: string,
  ) => {
    const { error: actionError } = await action();
    if (actionError) {
      showToast({
        type: "error",
        title: t("toast.actionFailedTitle"),
        description: actionError.message,
      });
      return false;
    }

    showToast({
      type: "success",
      title: successTitle,
      description: successDescription,
    });
    await refresh();
    return true;
  };

  const join = async () => {
    if (!event || hasJoined || isJoining || isOrganizer) {
      return;
    }

    setIsJoining(true);
    try {
      const { error: joinError, data } = await joinEvent(event.id);

      if (joinError) {
        errorNotification();
        showToast({
          type: "error",
          title: t("toast.joinFailedTitle"),
          description: joinError.message,
        });
        return;
      }

      const pending =
        !data?.joinedWaitlist &&
        hasPendingParticipation(data?.participantStatus);

      showToast({
        type: "success",
        title: data?.joinedWaitlist
          ? t("toast.joinedWaitlistTitle")
          : pending
            ? t("toast.applicationReceivedTitle")
            : t("toast.joinedTitle"),
        description: data?.joinedWaitlist
          ? t("toast.joinedWaitlistDescription")
          : pending
            ? t("toast.applicationReceivedDescription")
            : t("toast.joinedDescription"),
      });
      successNotification();
      await refresh();
    } finally {
      setIsJoining(false);
    }
  };

  const leave = async () => {
    if (!event || !hasJoined || isLeaving || isOrganizer) {
      return;
    }

    if (hasEventEnded(event)) {
      showToast({
        type: "error",
        title: t("toast.cannotLeaveTitle"),
        description: t("toast.cannotLeaveEndedDescription"),
      });
      return;
    }

    setIsLeaving(true);
    try {
      const pending = hasPendingParticipation(event.myParticipationStatus);
      const waitlisted = event.isOnWaitlist;

      const ok = await runAction(
        () => cancelParticipation(event.id),
        waitlisted
          ? t("toast.leftWaitlistTitle")
          : pending
            ? t("toast.applicationWithdrawnTitle")
            : t("toast.leftTitle"),
        waitlisted
          ? t("toast.leftWaitlistDescription")
          : pending
            ? t("toast.applicationWithdrawnDescription")
            : t("toast.leftDescription"),
      );
      if (ok) {
        successNotification();
      } else {
        errorNotification();
      }
    } finally {
      setIsLeaving(false);
    }
  };

  const respondToInvitation = async (accept: boolean) => {
    if (!event || isRespondingInvitation) return;

    setIsRespondingInvitation(true);
    try {
      const ok = await runAction(
        () =>
          accept
            ? acceptEventInvitation(event.id)
            : declineEventInvitation(event.id),
        accept
          ? t("toast.invitationAcceptedTitle")
          : t("toast.invitationDeclinedTitle"),
        accept ? t("toast.invitationAcceptedDescription") : undefined,
      );
      ok ? successNotification() : errorNotification();
    } finally {
      setIsRespondingInvitation(false);
    }
  };

  const withUser = async (
    userId: string,
    action: () => Promise<{ error: { message: string } | null }>,
    title: string,
  ) => {
    setBusyUserId(userId);
    try {
      return await runAction(action, title);
    } finally {
      setBusyUserId(null);
    }
  };

  const approve = (userId: string) =>
    event
      ? withUser(
          userId,
          () => approveParticipant(event.id, userId),
          t("toast.participantApprovedTitle"),
        )
      : Promise.resolve(false);

  const reject = (userId: string) =>
    event
      ? withUser(
          userId,
          () => rejectParticipant(event.id, userId),
          t("toast.applicationRejectedTitle"),
        )
      : Promise.resolve(false);

  const promote = (userId: string) =>
    event
      ? withUser(
          userId,
          () => promoteFromWaitlist(event.id, userId),
          t("toast.promotedFromWaitlistTitle"),
        )
      : Promise.resolve();

  const markAttended = (userId: string) =>
    event
      ? withUser(
          userId,
          () => confirmAttendance(event.id, userId),
          t("toast.markedAttendedTitle"),
        )
      : Promise.resolve();

  const markAbsent = (userId: string) =>
    event
      ? withUser(
          userId,
          () => markNoShow(event.id, userId),
          t("toast.markedAbsentTitle"),
        )
      : Promise.resolve();

  const cancel = async () => {
    if (!event || isMutating) {
      return;
    }
    setIsMutating(true);
    try {
      await runAction(
        () => cancelEvent(event.id),
        t("toast.eventCancelledTitle"),
        t("toast.eventCancelledDescription"),
      );
    } finally {
      setIsMutating(false);
    }
  };

  const complete = async () => {
    if (!event || isMutating) {
      return;
    }
    setIsMutating(true);
    try {
      await runAction(
        () => completeEvent(event.id),
        t("toast.eventCompletedTitle"),
        t("toast.eventCompletedDescription"),
      );
    } finally {
      setIsMutating(false);
    }
  };

  return {
    event,
    isLoading,
    isRefreshing,
    isJoining,
    isLeaving,
    isRespondingInvitation,
    isMutating,
    busyUserId,
    hasJoined,
    isFull,
    isOrganizer,
    canCancel,
    canManage,
    canComplete,
    canTakeAttendance,
    join,
    leave,
    acceptInvitation: () => respondToInvitation(true),
    declineInvitation: () => respondToInvitation(false),
    approve,
    reject,
    promote,
    markAttended,
    markAbsent,
    cancel,
    complete,
    refresh,
    error,
  };
}
