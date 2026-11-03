import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { AppText as Text } from "@/components";
import { HIT_SLOP, shadows, themeColors } from "@/constants/theme";
import { STORAGE_KEYS } from "@/constants/storage-keys";
import { useAuth } from "@/contexts";
import { FALLBACK_EVENT_DURATION_MINUTES } from "@/features/events/copy";
import { getMyParticipatingEvents } from "@/features/events/services/events-service";
import { hasApprovedParticipation } from "@/features/events/status";
import { EVENT_STATUS, type EventSummary } from "@/features/events/types";
import { sportIconForSlug } from "@/features/sports/sports";

// Bitişten sonra bu kadar süre davet ediliyor; sonrası bayat bir hatıra.
const SHARE_WINDOW_MS = 48 * 60 * 60 * 1000;

async function readDismissed(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.dismissedShareEventIds);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

async function addDismissed(eventId: string) {
  const current = await readDismissed();
  // Liste sınırsız büyümesin; eski etkinlikler zaten pencereden çıkmış oluyor.
  const next = [eventId, ...current.filter((id) => id !== eventId)].slice(
    0,
    30,
  );
  await AsyncStorage.setItem(
    STORAGE_KEYS.dismissedShareEventIds,
    JSON.stringify(next),
  ).catch(() => undefined);
}

function endedRecently(event: EventSummary, now: number): boolean {
  if (event.status === EVENT_STATUS.cancelled) {
    return false;
  }
  const start = new Date(event.eventDate).getTime();
  const end =
    start + (event.durationMinutes ?? FALLBACK_EVENT_DURATION_MINUTES) * 60_000;
  return end <= now && now - end <= SHARE_WINDOW_MS;
}

/**
 * Son 48 saatte biten etkinliğin fotoğrafını paylaşmaya davet. Paylaşınca da
 * kapatınca da o etkinlik için bir daha çıkmıyor.
 */
export function ShareMomentsCard() {
  const { t } = useTranslation("events");
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [event, setEvent] = useState<EventSummary | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) {
        setEvent(null);
        return;
      }
      void Promise.all([
        getMyParticipatingEvents(1, 10, "past"),
        readDismissed(),
      ])
        .then(([page, dismissed]) => {
          const now = Date.now();
          const candidate = page.items.find(
            (item) =>
              hasApprovedParticipation(item.myParticipationStatus) &&
              endedRecently(item, now) &&
              !dismissed.includes(item.id),
          );
          setEvent(candidate ?? null);
        })
        .catch(() => undefined);
    }, [isAuthenticated]),
  );

  if (!event) {
    return null;
  }

  const dismiss = () => {
    setEvent(null);
    void addDismissed(event.id);
  };

  const share = () => {
    dismiss();
    router.push({
      pathname: "/posts/create",
      params: { eventId: event.id, eventTitle: event.title },
    });
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={share}
      className="flex-row items-center gap-md rounded-[22px] border border-border-default bg-surface-secondary p-md active:opacity-80"
      style={shadows.md}
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-primary/15">
        <FontAwesome6
          name={sportIconForSlug(event.sport)}
          size={16}
          color={themeColors.brand.primary}
        />
      </View>

      <View className="flex-1 gap-xs">
        <Text
          numberOfLines={1}
          className="font-body-bold text-body text-text-primary"
        >
          {t("shareMomentsCard.title", { title: event.title })}
        </Text>
        <Text numberOfLines={1} className="text-caption text-text-secondary">
          {t("shareMomentsCard.subtitle")}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("shareMomentsCard.dismiss")}
        hitSlop={HIT_SLOP}
        onPress={dismiss}
        className="p-1 active:opacity-60"
      >
        <FontAwesome6
          name="xmark"
          size={14}
          color={themeColors.text.tertiary}
        />
      </Pressable>
    </Pressable>
  );
}
