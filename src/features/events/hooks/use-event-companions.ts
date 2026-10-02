import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { isValidEmail, PERSON_NAME_MAX_LENGTH } from "@/constants/validation";
import { assignEventParticipants } from "@/features/events/services/organizer-service";
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
  /** Organizatör dahil toplam kontenjan. */
  maxPlayers: number;
  /** Kontenjan alanı geçerli mi; değilse fazla seçimler kırpılmaz. */
  isCapacityValid: boolean;
};

/**
 * Etkinlik oluştururken davet edilen arkadaşlar ve isimle eklenen misafirler.
 * Organizatör bir yer kaplar; davetler kalan kontenjanı aşamaz.
 */
export function useEventCompanions({ maxPlayers, isCapacityValid }: Options) {
  const { t } = useTranslation("eventCreate");
  const [friends, setFriends] = useState<ApiFriend[]>([]);
  const [isFriendsLoading, setIsFriendsLoading] = useState(true);
  const [guests, setGuests] = useState<EventGuestDraft[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);

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

  const reservedCount = guests.length + selectedFriendIds.length;
  const remainingSlots = Math.max(maxPlayers - 1 - reservedCount, 0);
  const areGuestsValid = guests.every(
    (guest) =>
      guest.firstName.trim().length > 0 &&
      guest.lastName.trim().length > 0 &&
      isValidEmail(guest.email),
  );

  // Kontenjan düşürülürse fazla davetleri kırp (önce arkadaşlar).
  useEffect(() => {
    if (!isCapacityValid) return;

    const allowed = Math.max(Math.floor(maxPlayers) - 1, 0);
    if (reservedCount <= allowed) return;

    setSelectedFriendIds((current) => {
      const friendAllowance = Math.max(allowed - guests.length, 0);
      return current.slice(0, friendAllowance);
    });
    setGuests((current) => current.slice(0, allowed));
  }, [guests.length, isCapacityValid, maxPlayers, reservedCount]);

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

  /**
   * Oluşturulan etkinlik(ler)e davet/misafir atar. Hata durumunda backend'in
   * gerçek sebebini döner — yutulursa kullanıcı da biz de neden başarısız
   * olduğunu göremiyoruz (ör. yaş aralığı, kapasite, arkadaşlık durumu).
   */
  const assignTo = async (
    eventIds: string | string[],
  ): Promise<{ ok: boolean; reason?: string }> => {
    if (guests.length === 0 && selectedFriendIds.length === 0) {
      return { ok: true };
    }

    const ids = Array.isArray(eventIds) ? eventIds : [eventIds];

    try {
      await Promise.all(
        ids.map((eventId) =>
          assignEventParticipants(eventId, {
            guests: guests.map((guest) => ({
              firstName: guest.firstName.trim(),
              lastName: guest.lastName.trim(),
              email: guest.email.trim().toLowerCase(),
            })),
            friendUserIds: selectedFriendIds,
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
    remainingSlots,
    areGuestsValid,
    addGuest,
    updateGuest,
    removeGuest,
    toggleFriend,
    assignTo,
  };
}
