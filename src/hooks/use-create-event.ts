import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";

import {
  CREATE_EVENT_LIMITS,
  CREATE_SPORT_OPTIONS,
  DEFAULT_EVENT_DURATION_MINUTES,
  DEFAULT_EVENT_MAX_AGE,
  DEFAULT_EVENT_MIN_AGE,
} from "@/constants/events";
import { useToast } from "@/contexts";
import {
  assignEventParticipants,
  createEvent,
} from "@/services/events-service";
import { listFriends } from "@/services/social-service";
import { listSports } from "@/services/sports-service";
import type { CreateEventFormValues } from "@/types/events";
import type { SelectedLocation } from "@/types/location";
import type { Sport, SportCategory } from "@/types/sports";
import type { ApiFriend } from "@/types/social";
import { parseFeeAmount, sportIconForSlug } from "@/utils/events";

function getDefaultEventDate() {
  const date = new Date();
  date.setHours(date.getHours() + 2, 0, 0, 0);
  return date;
}

function toSportOptions(sports: Sport[]): SportCategory[] {
  if (sports.length === 0) {
    return CREATE_SPORT_OPTIONS;
  }

  return [...sports]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((sport) => ({
      key: sport.slug,
      label: sport.name,
      icon: sportIconForSlug(sport.slug),
    }));
}

export function useCreateEvent() {
  const router = useRouter();
  const { showToast } = useToast();

  const [sports, setSports] = useState<Sport[]>([]);
  const [isSportsLoading, setIsSportsLoading] = useState(true);
  const [values, setValues] = useState<CreateEventFormValues>({
    title: "",
    description: "",
    sportSlug: CREATE_SPORT_OPTIONS[0]?.key ?? "futbol",
    eventDate: getDefaultEventDate(),
    durationMinutes: DEFAULT_EVENT_DURATION_MINUTES,
    maxPlayers: "10",
    minParticipantAge: String(DEFAULT_EVENT_MIN_AGE),
    maxParticipantAge: String(DEFAULT_EVENT_MAX_AGE),
    skillLevel: null,
    isPaid: false,
    feeAmountText: "",
    addressText: "",
    latitude: null,
    longitude: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [friends, setFriends] = useState<ApiFriend[]>([]);
  const [isFriendsLoading, setIsFriendsLoading] = useState(true);
  const [guests, setGuests] = useState<
    { localId: string; firstName: string; lastName: string }[]
  >([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setIsSportsLoading(true);

      try {
        const catalog = await listSports();
        if (cancelled) {
          return;
        }

        setSports(catalog);

        const options = toSportOptions(catalog);
        setValues((prev) => {
          if (options.some((option) => option.key === prev.sportSlug)) {
            return prev;
          }

          return {
            ...prev,
            sportSlug: options[0]?.key ?? prev.sportSlug,
          };
        });
      } catch {
        if (!cancelled) {
          setSports([]);
        }
      } finally {
        if (!cancelled) {
          setIsSportsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void listFriends(1, 20)
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

  const sportOptions = useMemo(() => toSportOptions(sports), [sports]);

  const update = <K extends keyof CreateEventFormValues>(
    key: K,
    value: CreateEventFormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const setLocation = (location: SelectedLocation) => {
    setValues((prev) => ({
      ...prev,
      addressText: location.addressText,
      latitude: location.latitude,
      longitude: location.longitude,
    }));
  };

  const maxPlayersNumber = Number(values.maxPlayers);
  const minParticipantAgeNumber = Number(values.minParticipantAge);
  const maxParticipantAgeNumber = Number(values.maxParticipantAge);

  const isStep1Valid = useMemo(() => {
    const title = values.title.trim();

    return (
      Boolean(values.sportSlug) &&
      title.length > 0 &&
      title.length <= CREATE_EVENT_LIMITS.titleMax &&
      !isSportsLoading
    );
  }, [isSportsLoading, values.sportSlug, values.title]);

  const isStep2Valid = useMemo(() => {
    return (
      values.durationMinutes > 0 &&
      Boolean(values.addressText.trim()) &&
      values.latitude != null &&
      values.longitude != null &&
      values.latitude >= -90 &&
      values.latitude <= 90 &&
      values.longitude >= -180 &&
      values.longitude <= 180 &&
      values.eventDate.getTime() > Date.now()
    );
  }, [
    values.addressText,
    values.durationMinutes,
    values.eventDate,
    values.latitude,
    values.longitude,
  ]);

  const isStep3Valid = useMemo(() => {
    const feeAmount = parseFeeAmount(values.feeAmountText);
    const feeOk = values.isPaid
      ? feeAmount != null &&
        feeAmount > 0 &&
        feeAmount <= CREATE_EVENT_LIMITS.feeAmountMax
      : true;

    return (
      Number.isFinite(maxPlayersNumber) &&
      maxPlayersNumber >= CREATE_EVENT_LIMITS.maxParticipantsMin &&
      maxPlayersNumber <= CREATE_EVENT_LIMITS.maxParticipantsMax &&
      Number.isInteger(minParticipantAgeNumber) &&
      Number.isInteger(maxParticipantAgeNumber) &&
      minParticipantAgeNumber >= CREATE_EVENT_LIMITS.participantAgeMin &&
      maxParticipantAgeNumber <= CREATE_EVENT_LIMITS.participantAgeMax &&
      minParticipantAgeNumber <= maxParticipantAgeNumber &&
      feeOk
    );
  }, [
    maxParticipantAgeNumber,
    maxPlayersNumber,
    minParticipantAgeNumber,
    values.feeAmountText,
    values.isPaid,
  ]);

  const areGuestsValid = guests.every(
    (guest) =>
      guest.firstName.trim().length > 0 && guest.lastName.trim().length > 0,
  );
  const canSubmit =
    isStep1Valid && isStep2Valid && isStep3Valid && areGuestsValid;
  const reservedCount = guests.length + selectedFriendIds.length;
  const remainingCompanionSlots = Math.max(
    maxPlayersNumber - 1 - reservedCount,
    0,
  );

  useEffect(() => {
    if (!isStep3Valid) return;

    const allowed = Math.max(Math.floor(maxPlayersNumber) - 1, 0);
    if (reservedCount <= allowed) return;

    setSelectedFriendIds((current) => {
      const friendAllowance = Math.max(allowed - guests.length, 0);
      return current.slice(0, friendAllowance);
    });
    setGuests((current) => current.slice(0, allowed));
  }, [guests.length, isStep3Valid, maxPlayersNumber, reservedCount]);

  const addGuest = () => {
    if (remainingCompanionSlots <= 0) return;
    setGuests((current) => [
      ...current,
      {
        localId: `${Date.now()}-${current.length}`,
        firstName: "",
        lastName: "",
      },
    ]);
  };

  const updateGuest = (
    localId: string,
    key: "firstName" | "lastName",
    value: string,
  ) => {
    setGuests((current) =>
      current.map((guest) =>
        guest.localId === localId
          ? { ...guest, [key]: value.slice(0, 50) }
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
      if (remainingCompanionSlots <= 0) return current;
      return [...current, userId];
    });
  };

  const submit = async () => {
    if (
      !canSubmit ||
      isSubmitting ||
      values.latitude == null ||
      values.longitude == null
    ) {
      return;
    }

    const sportId = sports.find((sport) => sport.slug === values.sportSlug)?.id;

    if (!sportId) {
      showToast({
        type: "error",
        title: "Spor bulunamadı",
        description: "Spor listesi yüklenemedi. Biraz sonra tekrar dene.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await createEvent({
        title: values.title.trim(),
        description: values.description.trim(),
        sportId,
        eventDate: values.eventDate.toISOString(),
        durationMinutes: values.durationMinutes,
        maxParticipants: maxPlayersNumber,
        minParticipantAge: minParticipantAgeNumber,
        maxParticipantAge: maxParticipantAgeNumber,
        skillLevel: values.skillLevel,
        isPaid: values.isPaid,
        feeAmount: values.isPaid ? parseFeeAmount(values.feeAmountText) : null,
        address: values.addressText.trim(),
        latitude: values.latitude,
        longitude: values.longitude,
      });

      if (!data) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showToast({
          type: "error",
          title: "Etkinlik yayınlanamadı",
          description: error?.message ?? "Tekrar dene.",
        });
        return;
      }

      if (!data.published) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showToast({
          type: "error",
          title: "Yayınlanamadı",
          description:
            error?.message ??
            "Etkinlik taslak olarak kaydedildi. Detaydan tekrar dene.",
        });
        await assignIfNeeded(data.id);
        router.replace(`/events/${data.id}`);
        return;
      }

      const assigned = await assignIfNeeded(data.id);

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast({
        type: assigned ? "success" : "error",
        title: assigned
          ? "Etkinlik yayınlandı"
          : "Etkinlik yayınlandı, davetler gönderilemedi",
        description: assigned
          ? selectedFriendIds.length > 0
            ? "Arkadaşlarına etkinlik daveti gönderildi."
            : "Oyuncular seni bekliyor."
          : "Davetleri etkinlik detayından tekrar gönderebilirsin.",
      });

      router.replace(`/events/${data.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const assignIfNeeded = async (eventId: string) => {
    if (guests.length === 0 && selectedFriendIds.length === 0) return true;

    try {
      await assignEventParticipants(eventId, {
        guests: guests.map((guest) => ({
          firstName: guest.firstName.trim(),
          lastName: guest.lastName.trim(),
        })),
        friendUserIds: selectedFriendIds,
      });
      return true;
    } catch {
      return false;
    }
  };

  return {
    values,
    update,
    setLocation,
    isStep1Valid,
    isStep2Valid,
    isStep3Valid,
    areGuestsValid,
    canSubmit,
    isSubmitting,
    isSportsLoading,
    sportOptions,
    friends,
    isFriendsLoading,
    guests,
    selectedFriendIds,
    remainingCompanionSlots,
    addGuest,
    updateGuest,
    removeGuest,
    toggleFriend,
    submit,
  };
}
