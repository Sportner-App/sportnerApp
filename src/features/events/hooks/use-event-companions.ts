import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useSession } from "@/contexts";
import { isValidEmail, PERSON_NAME_MAX_LENGTH } from "@/constants/validation";
import { assignEventParticipants } from "@/features/events/services/organizer-service";
import { listOrganizationMembers } from "@/features/organizations/services/organizations-service";
import {
  ORGANIZATION_STATUS,
  type ApiOrganizationMember,
} from "@/features/organizations/types";
import { listFriends } from "@/features/social/services/social-service";
import type { ApiFriend } from "@/features/social/types";
import { getApiErrorMessage } from "@/lib/api/errors";

const GUEST_EMAIL_MAX_LENGTH = 320;
const FRIEND_PICKER_PAGE_SIZE = 20;

export type EventGuestDraft = {
  localId: string;
  firstName: string;
  lastName: string;
  email: string;
};

type Options = {
  /** Organizatör dahil toplam kontenjan; sınırsızsa Infinity. */
  maxPlayers: number;
  /** Kontenjan alanı geçerli mi; değilse fazla seçimler kırpılmaz. */
  isCapacityValid: boolean;
  /** false: kulüp etkinliğinde düzenleyen oynamıyor, kontenjandan yer kaplamaz. */
  organizerTakesSlot?: boolean;
  /** Doluysa kulüp etkinliği: misafir yok, davetler yalnızca kulüp üyelerinden. */
  organizationId?: string;
};

export type ClubMembersStatus = "idle" | "loading" | "ready" | "error";

/**
 * Etkinlik oluştururken davet edilen arkadaşlar ve isimle eklenen misafirler.
 * Organizatör bir yer kaplar; davetler kalan kontenjanı aşamaz.
 */
export function useEventCompanions({
  maxPlayers,
  isCapacityValid,
  organizerTakesSlot = true,
  organizationId,
}: Options) {
  const { t } = useTranslation("eventCreate");
  const { user } = useSession();
  const isClubEvent = Boolean(organizationId);
  const [friends, setFriends] = useState<ApiFriend[]>([]);
  const [isFriendsLoading, setIsFriendsLoading] = useState(true);
  const [guests, setGuests] = useState<EventGuestDraft[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<
    ApiOrganizationMember[]
  >([]);
  const [clubMembers, setClubMembers] = useState<ApiOrganizationMember[]>([]);
  const [clubMembersStatus, setClubMembersStatus] =
    useState<ClubMembersStatus>("idle");
  const membersRequestRef = useRef(0);

  // Kulüp değişince (seçilince, değişince, bırakılınca) tüm davetler sıfırlanır:
  // üyeler başka kulübe, arkadaşlar/misafirler kulüp etkinliğine taşınamaz.
  useEffect(() => {
    membersRequestRef.current += 1;
    setClubMembers([]);
    setClubMembersStatus("idle");
    setSelectedMembers([]);
    setSelectedFriendIds([]);
    setGuests([]);
  }, [organizationId]);

  const loadClubMembers = useCallback(
    (force = false) => {
      if (!organizationId) return;
      if (!force && clubMembersStatus !== "idle") return;

      const requestId = ++membersRequestRef.current;
      setClubMembersStatus("loading");
      void listOrganizationMembers(organizationId)
        .then((members) => {
          if (requestId !== membersRequestRef.current) return;
          setClubMembers(
            members.filter(
              (member) =>
                member.status === ORGANIZATION_STATUS.approved &&
                member.userId !== user?.id,
            ),
          );
          setClubMembersStatus("ready");
        })
        .catch(() => {
          if (requestId !== membersRequestRef.current) return;
          setClubMembersStatus("error");
        });
    },
    [clubMembersStatus, organizationId, user?.id],
  );

  useEffect(() => {
    let cancelled = false;
    void listFriends(1, FRIEND_PICKER_PAGE_SIZE)
      .then((page) => {
        if (!cancelled) {
          setFriends(page?.items ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) setFriends([]);
      })
      .finally(() => {
        if (!cancelled) setIsFriendsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const reservedCount =
    guests.length + selectedFriendIds.length + selectedMembers.length;
  const organizerSlots = organizerTakesSlot ? 1 : 0;
  const remainingSlots = Math.max(
    maxPlayers - organizerSlots - reservedCount,
    0,
  );
  const areGuestsValid =
    isClubEvent ||
    guests.every(
      (guest) =>
        guest.firstName.trim().length > 0 &&
        guest.lastName.trim().length > 0 &&
        isValidEmail(guest.email),
    );

  // Kontenjan düşürülürse fazla davetleri kırp (önce arkadaşlar).
  useEffect(() => {
    if (!isCapacityValid) return;

    const allowed = Math.max(Math.floor(maxPlayers) - organizerSlots, 0);
    if (reservedCount <= allowed) return;

    setSelectedFriendIds((current) => {
      const friendAllowance = Math.max(allowed - guests.length, 0);
      return current.slice(0, friendAllowance);
    });
    setSelectedMembers((current) => current.slice(0, allowed));
    setGuests((current) => current.slice(0, allowed));
  }, [
    guests.length,
    isCapacityValid,
    maxPlayers,
    organizerSlots,
    reservedCount,
  ]);

  const addGuest = () => {
    if (remainingSlots <= 0) return;
    setGuests((current) => [
      ...current,
      {
        localId: `${Date.now()}-${current.length}`,
        firstName: "",
        lastName: "",
        email: "",
      },
    ]);
  };

  const updateGuest = (
    localId: string,
    key: "firstName" | "lastName" | "email",
    value: string,
  ) => {
    const maxLength =
      key === "email" ? GUEST_EMAIL_MAX_LENGTH : PERSON_NAME_MAX_LENGTH;
    setGuests((current) =>
      current.map((guest) =>
        guest.localId === localId
          ? { ...guest, [key]: value.slice(0, maxLength) }
          : guest,
      ),
    );
  };

  const removeGuest = (localId: string) => {
    setGuests((current) =>
      current.filter((guest) => guest.localId !== localId),
    );
  };

  const toggleFriend = (userId: string) => {
    setSelectedFriendIds((current) => {
      if (current.includes(userId)) {
        return current.filter((id) => id !== userId);
      }
      if (remainingSlots <= 0) return current;
      return [...current, userId];
    });
  };

  const setMembers = (members: ApiOrganizationMember[]) => {
    // Kontenjanı aşan seçim kabul edilmez (misafir/arkadaş yok kulüpte).
    const allowed = Math.max(Math.floor(maxPlayers) - organizerSlots, 0);
    setSelectedMembers(members.slice(0, allowed));
  };

  const invitedUserIds = isClubEvent
    ? selectedMembers.map((member) => member.userId)
    : selectedFriendIds;

  /**
   * Oluşturulan etkinlik(ler)e davet/misafir atar. Hata durumunda backend'in
   * gerçek sebebini döner — yutulursa kullanıcı da biz de neden başarısız
   * olduğunu göremiyoruz (ör. yaş aralığı, kapasite, arkadaşlık durumu).
   */
  const assignTo = async (
    eventIds: string | string[],
  ): Promise<{ ok: boolean; reason?: string }> => {
    const guestsToSend = isClubEvent ? [] : guests;
    if (guestsToSend.length === 0 && invitedUserIds.length === 0) {
      return { ok: true };
    }

    const ids = Array.isArray(eventIds) ? eventIds : [eventIds];

    try {
      await Promise.all(
        ids.map((eventId) =>
          assignEventParticipants(eventId, {
            guests: guestsToSend.map((guest) => ({
              firstName: guest.firstName.trim(),
              lastName: guest.lastName.trim(),
              email: guest.email.trim().toLowerCase(),
            })),
            friendUserIds: invitedUserIds,
          }),
        ),
      );
      return { ok: true };
    } catch (assignError) {
      return {
        ok: false,
        reason: getApiErrorMessage(
          assignError,
          t("toast.invitesGenericFailure"),
        ),
      };
    }
  };

  return {
    friends,
    isFriendsLoading,
    guests,
    selectedFriendIds,
    selectedMembers,
    clubMembers,
    clubMembersStatus,
    loadClubMembers,
    setMembers,
    invitedUserIds,
    remainingSlots,
    areGuestsValid,
    addGuest,
    updateGuest,
    removeGuest,
    toggleFriend,
    assignTo,
  };
}
