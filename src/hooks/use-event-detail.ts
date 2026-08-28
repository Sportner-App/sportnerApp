import { useCallback, useEffect, useState } from "react";

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
          err instanceof Error ? err.message : "Etkinlik detayı yüklenemedi.",
        );
        setEvent(null);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [id],
  );

  const refresh = useCallback(() => load("refresh"), [load]);

  useEffect(() => {
    void load("initial");
  }, [load]);

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

  const runAction = async (
    action: () => Promise<{ error: { message: string } | null }>,
    successTitle: string,
    successDescription?: string,
  ) => {
    const { error: actionError } = await action();
    if (actionError) {
      showToast({
        type: "error",
        title: "İşlem başarısız",
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
          title: "Katılım başarısız",
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
          ? "Bekleme listesine alındın"
          : pending
            ? "Başvurun alındı"
            : "Katıldın",
        description: data?.joinedWaitlist
          ? "Yer açılınca bilgilendirileceksin."
          : pending
            ? "Organizatör onaylayınca katılacaksın."
            : "Etkinlik detayları güncellendi. İyi eğlenceler!",
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
        title: "Ayrılamazsın",
        description: "Biten etkinlikten ayrılamazsın.",
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
          ? "Listeden çıktın"
          : pending
            ? "Başvurun geri çekildi"
            : "Ayrıldın",
        waitlisted
          ? "Bekleme listesinden çıktın."
          : pending
            ? "Organizatör artık başvurunu görmeyecek."
            : "Katılımın iptal edildi.",
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
        accept ? "Davet kabul edildi" : "Davet reddedildi",
        accept ? "Etkinliğin katılımcıları arasındasın." : undefined,
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
          "Katılımcı onaylandı",
        )
      : Promise.resolve(false);

  const reject = (userId: string) =>
    event
      ? withUser(
          userId,
          () => rejectParticipant(event.id, userId),
          "Başvuru reddedildi",
        )
      : Promise.resolve(false);

  const promote = (userId: string) =>
    event
      ? withUser(
          userId,
          () => promoteFromWaitlist(event.id, userId),
          "Bekleme listesinden alındı",
        )
      : Promise.resolve();

  const markAttended = (userId: string) =>
    event
      ? withUser(
          userId,
          () => confirmAttendance(event.id, userId),
          "Geldi olarak işaretlendi. Şimdi puanlayabilirsin.",
        )
      : Promise.resolve();

  const markAbsent = (userId: string) =>
    event
      ? withUser(
          userId,
          () => markNoShow(event.id, userId),
          "Gelmedi işaretlendi",
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
        "Etkinlik iptal edildi",
        "Katılımcılar bilgilendirilecek.",
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
        "Etkinlik tamamlandı",
        "Önce yoklama al, sonra gelenleri puanla. Yorumlar profillerinde görünür.",
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
