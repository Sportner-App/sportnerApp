import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { resolveEventBadgeThemes } from "@/constants/badge-colors";
import { sportAccentToken, themeColors } from "@/constants/theme";
import type { IconName } from "@/types/components";
import type { EventDetail } from "@/types/events";
import {
  currentDateLocale,
  isEventToday,
  relativeEventBadge,
} from "@/utils/events";

import { PendingRequestsHeaderAction } from "./pending-requests-entry";
import { AppText as Text } from "@/components/app-text";

/** Kontrol satırının inset üstündeki yüksekliği; içerik bu kadar aşağıdan başlar. */
export const EVENT_DETAIL_TOP_BAR_HEIGHT = 56;

type EventDetailTopBarProps = {
  onBack: () => void;
  /** Katılım durumu; footer'ı şişirmesin diye burada küçük bir rozet olarak duruyor. */
  joinedLabel?: string;
  pendingCount?: number;
  onPendingPress?: () => void;
  onEdit?: () => void;
};

/**
 * Etkinlik fotoğrafının üzerinde yüzen kontrol satırı. Fotoğraf artık ekranın
 * tamamına zemin olduğu için header yalnızca butonları taşır.
 */
export function EventDetailTopBar({
  onBack,
  joinedLabel,
  pendingCount = 0,
  onPendingPress,
  onEdit,
}: EventDetailTopBarProps) {
  const { t } = useTranslation("eventDetail");
  const insets = useSafeAreaInsets();
  const showPending = pendingCount > 0 && onPendingPress;

  return (
    <View
      pointerEvents="box-none"
      className="flex-row items-center justify-between px-3.5"
      style={{
        paddingTop: insets.top + 6,
        height: insets.top + EVENT_DETAIL_TOP_BAR_HEIGHT,
      }}
    >
      <GlassControl
        accessibilityLabel={t("common:back")}
        icon="arrow-left"
        onPress={onBack}
      />
      <View className="flex-row items-center gap-2">
        {joinedLabel ? <JoinedBadge label={joinedLabel} /> : null}
        {onEdit ? (
          <GlassControl
            accessibilityLabel={t("organizerPanel.editAccessibility")}
            icon="pen"
            onPress={onEdit}
          />
        ) : null}
        {showPending ? (
          <PendingRequestsHeaderAction
            count={pendingCount}
            onPress={onPendingPress}
          />
        ) : null}
      </View>
    </View>
  );
}

/** Spor ve tarih etiketleri; eskiden hero'nun alt köşelerindeydi, artık başlığın üstünde. */
export function EventDetailBadges({ event }: { event: EventDetail }) {
  const accent = sportAccentToken(event.sport);
  const sportColor = accent?.accent ?? themeColors.text.secondary;
  const onAccent = accent?.onAccent ?? themeColors.text.inverse;
  const sportLabel = event.sportName
    .trim()
    .toLocaleUpperCase(currentDateLocale());
  const dateBadge = relativeEventBadge(event.eventDate);
  const badgeThemes = resolveEventBadgeThemes({
    sportAccent: sportColor,
    isPaid: event.isPaid,
    urgency: isEventToday(event.eventDate) ? "today" : "upcoming",
  });

  if (!sportLabel && !dateBadge) {
    return null;
  }

  return (
    <View className="flex-row flex-wrap items-center gap-2">
      {sportLabel ? (
        <View
          className="max-w-[62%] flex-row items-center rounded-pill px-2.5 py-1"
          style={{ backgroundColor: sportColor }}
        >
          <FontAwesome6 name={event.sportIcon} size={10} color={onAccent} />
          <Text
            numberOfLines={1}
            className="ml-1.5 font-body-bold text-overline tracking-[1.2px]"
            style={{ color: onAccent }}
          >
            {sportLabel}
          </Text>
        </View>
      ) : null}
      {dateBadge ? (
        <View
          className="rounded-pill px-2.5 py-1"
          style={{ backgroundColor: badgeThemes.date.background }}
        >
          <Text
            className="font-body-bold text-overline tracking-wide"
            style={{ color: badgeThemes.date.foreground }}
          >
            {dateBadge}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function JoinedBadge({ label }: { label: string }) {
  return (
    <View
      className="flex-row items-center gap-1.5 rounded-pill px-2.5 py-1"
      style={{ backgroundColor: themeColors.overlay.dark }}
    >
      <FontAwesome6 name="check" size={10} color={themeColors.brand.primary} />
      <Text
        numberOfLines={1}
        className="font-body-bold text-overline tracking-wide"
        style={{ color: themeColors.brand.primary }}
      >
        {label}
      </Text>
    </View>
  );
}

function GlassControl({
  accessibilityLabel,
  icon,
  onPress,
}: {
  accessibilityLabel: string;
  icon: IconName;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={4}
      onPress={onPress}
      className="h-11 w-11 items-center justify-center rounded-full active:opacity-80"
      style={{ backgroundColor: themeColors.overlay.dark }}
    >
      <FontAwesome6 name={icon} size={15} color={themeColors.text.inverse} />
    </Pressable>
  );
}
