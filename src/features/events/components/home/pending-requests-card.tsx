import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppState, Pressable, View } from "react-native";

import { AppText as Text } from "@/components";
import { Avatar } from "@/components/avatar";
import { BottomSheet } from "@/components/bottom-sheet";
import { shadows, themeColors } from "@/constants/theme";
import { useAuth } from "@/contexts";
import { formatEventDateLabel } from "@/features/events/format";
import { listPendingJoinRequestEvents } from "@/features/events/services/events-service";
import type { PendingJoinRequestEvent } from "@/features/events/types";

// Kart tek satır; fazlası "+N" baloncuğuyla gösteriliyor.
const MAX_AVATARS = 2;

/**
 * Organizatörün onay bekleyen katılım istekleri. Push kaçırılsa bile istekler
 * ancak etkinlik detayına girince görünüyordu; bu kart ana sayfanın tepesinde,
 * bekleyen istek olduğu sürece duruyor. Kapatma düğmesi bilerek yok: kart
 * istekler onaylanınca/reddedilince kendiliğinden kayboluyor.
 *
 * Ekran her odaklandığında ve uygulama öne geldiğinde yeniden soruluyor ki
 * sheet'ten dönünce sayı güncel olsun.
 */
export function PendingRequestsCard() {
  const { t } = useTranslation("events");
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [events, setEvents] = useState<PendingJoinRequestEvent[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  const refresh = useCallback(() => {
    if (!isAuthenticated) {
      setEvents([]);
      return;
    }
    void listPendingJoinRequestEvents()
      .then(setEvents)
      .catch(() => undefined);
  }, [isAuthenticated]);

  useFocusEffect(refresh);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refresh();
      }
    });
    return () => subscription.remove();
  }, [refresh]);

  if (events.length === 0) {
    return null;
  }

  const total = events.reduce((sum, item) => sum + item.pendingCount, 0);
  // En yakın tarihli etkinlik ilk sırada geliyor; birden fazla etkinlik
  // varsa da önce acil olanı açmak doğru.
  const first = events[0];
  const applicants = events
    .flatMap((item) => item.applicants)
    .slice(0, MAX_AVATARS);
  const overflow = total - applicants.length;

  const openRequests = (eventId: string) =>
    router.push(`/events/${eventId}?focus=requests`);

  // Tek etkinlikte doğrudan gidiyoruz; birden fazlaysa hangisine bakacağını
  // kullanıcı seçiyor, yoksa diğer etkinliğin başvuruları gözden kaçıyordu.
  const handlePress = () => {
    if (events.length === 1) {
      openRequests(first.eventId);
      return;
    }
    setPickerOpen(true);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("pendingRequestsCard.title", { count: total })}
        onPress={handlePress}
        className="flex-row items-center gap-md rounded-[22px] border border-brand-primary bg-surface-secondary p-md active:opacity-80"
        style={shadows.md}
      >
        <View className="flex-row">
          {applicants.map((applicant, index) => (
            <View
              key={applicant.userId}
              style={{ marginLeft: index === 0 ? 0 : -12 }}
            >
              <Avatar
                uri={applicant.avatarUrl}
                name={applicant.name}
                size={36}
                previewable={false}
              />
            </View>
          ))}
          {overflow > 0 ? (
            <View
              className="items-center justify-center rounded-full border border-brand-primary bg-surface-primary"
              style={{ width: 36, height: 36, marginLeft: -12 }}
            >
              <Text className="font-body-bold text-caption text-brand-primary">
                +{overflow}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="flex-1 gap-xs">
          <Text
            numberOfLines={1}
            className="font-body-bold text-body text-text-primary"
          >
            {t("pendingRequestsCard.title", { count: total })}
          </Text>
          <Text numberOfLines={1} className="text-caption text-text-secondary">
            {events.length === 1
              ? t("pendingRequestsCard.singleEvent", { title: first.title })
              : t("pendingRequestsCard.multiEvent", { count: events.length })}
          </Text>
        </View>

        <View className="flex-row items-center gap-xs">
          <Text className="font-body-bold text-caption text-brand-primary">
            {t("pendingRequestsCard.review")}
          </Text>
          <FontAwesome6
            name="chevron-right"
            size={12}
            color={themeColors.brand.primary}
          />
        </View>
      </Pressable>

      <BottomSheet
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title={t("pendingRequestsCard.pickerTitle")}
        subtitle={t("pendingRequestsCard.pickerSubtitle")}
      >
        <View className="gap-2">
          {events.map((item) => (
            <Pressable
              key={item.eventId}
              accessibilityRole="button"
              onPress={() => {
                setPickerOpen(false);
                openRequests(item.eventId);
              }}
              className="flex-row items-center gap-3 rounded-2xl border border-border-default bg-surface-primary p-3.5 active:opacity-80"
            >
              <View className="flex-1 gap-0.5">
                <Text
                  numberOfLines={1}
                  className="font-body-bold text-body text-text-primary"
                >
                  {item.title}
                </Text>
                <Text
                  numberOfLines={1}
                  className="text-caption text-text-secondary"
                >
                  {formatEventDateLabel(item.eventDate)}
                </Text>
              </View>
              <View className="rounded-full bg-brand-primary px-2.5 py-1">
                <Text className="font-body-bold text-caption text-background-primary">
                  {t("pendingRequestsCard.pendingBadge", {
                    count: item.pendingCount,
                  })}
                </Text>
              </View>
              <FontAwesome6
                name="chevron-right"
                size={12}
                color={themeColors.text.tertiary}
              />
            </Pressable>
          ))}
        </View>
      </BottomSheet>
    </>
  );
}
