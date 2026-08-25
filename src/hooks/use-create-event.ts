import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";

import {
  CREATE_EVENT_LIMITS,
  CREATE_SPORT_OPTIONS,
  DEFAULT_EVENT_DURATION_MINUTES,
} from "@/constants/events";
import { useToast } from "@/contexts";
import { createEvent } from "@/services/events-service";
import { listSports } from "@/services/sports-service";
import type { CreateEventFormValues } from "@/types/events";
import type { SelectedLocation } from "@/types/location";
import type { Sport, SportCategory } from "@/types/sports";
import { sportIconForSlug } from "@/utils/events";

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
    addressText: "",
    latitude: null,
    longitude: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    return (
      Number.isFinite(maxPlayersNumber) &&
      maxPlayersNumber >= CREATE_EVENT_LIMITS.maxParticipantsMin &&
      maxPlayersNumber <= CREATE_EVENT_LIMITS.maxParticipantsMax
    );
  }, [maxPlayersNumber]);

  const canSubmit = isStep1Valid && isStep2Valid && isStep3Valid;

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
        router.replace(`/events/${data.id}`);
        return;
      }

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast({
        type: "success",
        title: "Etkinlik yayınlandı",
        description: "Oyuncular seni bekliyor.",
      });

      router.replace(`/events/${data.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    values,
    update,
    setLocation,
    isStep1Valid,
    isStep2Valid,
    isStep3Valid,
    canSubmit,
    isSubmitting,
    isSportsLoading,
    sportOptions,
    submit,
  };
}
