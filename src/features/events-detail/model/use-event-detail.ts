import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { EventFeedItem } from "@/entities/event";
import { useAuth } from "@/features/auth";
import {
  createParticipationRequest,
  fetchEventDetailData,
  leaveEvent,
  setParticipationStatus,
} from "@/features/events-detail/api/event-detail-service";
import type {
  ParticipantProfile,
  ParticipantStatus,
} from "@/features/events-detail/model/types";

type ActionResult = {
  error: Error | null;
};

type UseEventDetailResult = {
  event: EventFeedItem | null;
  allParticipants: ParticipantProfile[];
  approvedParticipants: ParticipantProfile[];
  pendingParticipants: ParticipantProfile[];
  pendingRequestCount: number;
  approvedCount: number;
  maxPlayers: number;
  isOrganizer: boolean;
  currentUserStatus: ParticipantStatus | null;
  isLoading: boolean;
  isActionLoading: boolean;
  activeRequestId: string | null;
  error: string;
  refetch: () => Promise<void>;
  requestToJoin: () => Promise<ActionResult>;
  leaveFromEvent: () => Promise<ActionResult>;
  cancelPendingRequest: () => Promise<ActionResult>;
  approveRequest: (requestId: string) => Promise<ActionResult>;
  rejectRequest: (requestId: string) => Promise<ActionResult>;
};

function toError(caughtError: unknown, fallback: string) {
  if (caughtError instanceof Error) {
    return caughtError;
  }

  return new Error(fallback);
}

export function useEventDetail(eventId?: string): UseEventDetailResult {
  const router = useRouter();
  const { userId } = useAuth();

  const [event, setEvent] = useState<EventFeedItem | null>(null);
  const [allParticipants, setAllParticipants] = useState<ParticipantProfile[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchEvent = useCallback(async () => {
    if (!eventId) {
      setError("Etkinlik bulunamadi.");
      setEvent(null);
      setAllParticipants([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const detail = await fetchEventDetailData(eventId);

      setEvent(detail.event);
      setAllParticipants(detail.allParticipants);
    } catch (caughtError) {
      const resolvedError = toError(
        caughtError,
        "Etkinlik detayi yuklenemedi.",
      );
      setEvent(null);
      setAllParticipants([]);
      setError(resolvedError.message);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void fetchEvent();
  }, [fetchEvent]);

  const approvedParticipants = useMemo(
    () => allParticipants.filter((item) => item.status === "approved"),
    [allParticipants],
  );

  const pendingParticipants = useMemo(
    () => allParticipants.filter((item) => item.status === "pending"),
    [allParticipants],
  );

  const currentUserRequest = useMemo(() => {
    if (!userId) {
      return null;
    }

    return allParticipants.find((item) => item.userId === userId) ?? null;
  }, [allParticipants, userId]);

  const approvedCount = approvedParticipants.length;
  const pendingRequestCount = pendingParticipants.length;
  const maxPlayers = event?.max_players ?? 0;
  const isOrganizer = Boolean(userId && event && event.created_by === userId);
  const currentUserStatus = currentUserRequest?.status ?? null;

  const runAction = useCallback(
    async (
      action: () => Promise<void>,
      options?: {
        requestId?: string;
        optimisticUpdate?: () => void;
      },
    ): Promise<ActionResult> => {
      setIsActionLoading(true);
      setActiveRequestId(options?.requestId ?? null);
      const previousParticipants = allParticipants;

      options?.optimisticUpdate?.();

      try {
        await action();
        await fetchEvent();
        return { error: null };
      } catch (caughtError) {
        setAllParticipants(previousParticipants);
        return {
          error: toError(caughtError, "Islem basarisiz."),
        };
      } finally {
        setIsActionLoading(false);
        setActiveRequestId(null);
      }
    },
    [allParticipants, fetchEvent],
  );

  const requestToJoin = useCallback(async () => {
    if (!eventId || !userId) {
      router.push("/(auth)/login");
      return { error: new Error("Oturum acmaniz gerekiyor.") };
    }

    return runAction(() => createParticipationRequest(eventId, userId), {
      optimisticUpdate: () => {
        setAllParticipants((prev) => {
          const existing = prev.find((item) => item.userId === userId);

          if (existing) {
            return prev.map((item) =>
              item.userId === userId ? { ...item, status: "pending" } : item,
            );
          }

          return [
            ...prev,
            {
              userId,
              requestId: `temp-${userId}`,
              status: "pending",
              fullName: "Sen",
              avatarUrl: null,
              skillLevel: null,
            },
          ];
        });
      },
    });
  }, [eventId, router, runAction, userId]);

  const leaveFromEvent = useCallback(async () => {
    if (!eventId || !userId) {
      return { error: new Error("Oturum bulunamadi.") };
    }

    return runAction(() => leaveEvent(eventId, userId), {
      optimisticUpdate: () => {
        setAllParticipants((prev) =>
          prev.filter((item) => item.userId !== userId),
        );
      },
    });
  }, [eventId, runAction, userId]);

  const cancelPendingRequest = useCallback(async () => {
    return leaveFromEvent();
  }, [leaveFromEvent]);

  const approveRequest = useCallback(
    async (userId: string) => {
      if (!isOrganizer || !eventId) {
        return { error: new Error("Bu islem icin yetkiniz yok.") };
      }

      return runAction(
        () => setParticipationStatus(eventId, userId, "approved"),
        {
          optimisticUpdate: () => {
            setAllParticipants((prev) =>
              prev.map((item) =>
                item.userId === userId ? { ...item, status: "approved" } : item,
              ),
            );
          },
        },
      );
    },
    [isOrganizer, eventId, runAction],
  );

  const rejectRequest = useCallback(
    async (userId: string) => {
      if (!isOrganizer || !eventId) {
        return { error: new Error("Bu islem icin yetkiniz yok.") };
      }

      return runAction(
        () => setParticipationStatus(eventId, userId, "rejected"),
        {
          optimisticUpdate: () => {
            setAllParticipants((prev) =>
              prev.map((item) =>
                item.userId === userId ? { ...item, status: "rejected" } : item,
              ),
            );
          },
        },
      );
    },
    [isOrganizer, eventId, runAction],
  );

  return {
    event,
    allParticipants,
    approvedParticipants,
    pendingParticipants,
    pendingRequestCount,
    approvedCount,
    maxPlayers,
    isOrganizer,
    currentUserStatus,
    isLoading,
    isActionLoading,
    activeRequestId,
    error,
    refetch: fetchEvent,
    requestToJoin,
    leaveFromEvent,
    cancelPendingRequest,
    approveRequest,
    rejectRequest,
  };
}
