import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useMemo, useState } from "react";
import { ImageBackground, Pressable, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  type Region,
} from "react-native-maps";

import { DARK_MAP_STYLE, MAP_INITIAL_REGION } from "@/constants/map";
import { FALLBACK_SPORT_IMAGE, resolveEventPhoto } from "@/constants/sport-images";
import { shadows, sportAccentToken, themeColors } from "@/constants/theme";
import { isGooglePlacesEnabled } from "@/services/location-service";
import type { IconName } from "@/types/components";
import type { EventSummary } from "@/types/events";
import { formatEventTime, relativeEventBadge } from "@/utils/events";

type EventsMapProps = {
  events: EventSummary[];
  onOpenEvent: (eventId: string) => void;
};

function regionForEvents(events: EventSummary[]): Region {
  if (events.length === 0) {
    return MAP_INITIAL_REGION;
  }

  if (events.length === 1) {
    return {
      latitude: events[0].latitude,
      longitude: events[0].longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }

  let minLat = events[0].latitude;
  let maxLat = events[0].latitude;
  let minLng = events[0].longitude;
  let maxLng = events[0].longitude;

  for (const event of events) {
    minLat = Math.min(minLat, event.latitude);
    maxLat = Math.max(maxLat, event.latitude);
    minLng = Math.min(minLng, event.longitude);
    maxLng = Math.max(maxLng, event.longitude);
  }

  const latSpan = Math.max(maxLat - minLat, 0.01);
  const lngSpan = Math.max(maxLng - minLng, 0.01);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: latSpan * 1.6,
    longitudeDelta: lngSpan * 1.6,
  };
}

export function EventsMap({ events, onOpenEvent }: EventsMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const useGoogleMaps = isGooglePlacesEnabled();

  const located = useMemo(
    () =>
      events.filter(
        (event) =>
          Number.isFinite(event.latitude) && Number.isFinite(event.longitude),
      ),
    [events],
  );

  const initialRegion = useMemo(() => regionForEvents(located), [located]);
  const selectedEvent =
    located.find((event) => event.id === selectedId) ?? null;

  return (
    <View className="h-[560px] overflow-hidden rounded-xlarge border border-border-default">
      <MapView
        style={{ flex: 1 }}
        provider={useGoogleMaps ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        customMapStyle={useGoogleMaps ? DARK_MAP_STYLE : undefined}
        userInterfaceStyle="dark"
        showsUserLocation={false}
        showsCompass={false}
        showsPointsOfInterest={false}
        toolbarEnabled={false}
        onPress={() => setSelectedId(null)}
      >
        {located.map((event) => {
          const accent = sportAccentToken(event.sport);
          return (
            <Marker
              key={event.id}
              coordinate={{
                latitude: event.latitude,
                longitude: event.longitude,
              }}
              anchor={{ x: 0.5, y: 1 }}
              onPress={(pressEvent) => {
                pressEvent.stopPropagation();
                setSelectedId(event.id);
              }}
            >
              <EventMapPin
                icon={event.sportIcon}
                accent={accent?.accent ?? themeColors.brand.primary}
                active={event.id === selectedId}
              />
            </Marker>
          );
        })}
      </MapView>

      {located.length === 0 ? (
        <View className="absolute inset-0 items-center justify-center gap-2 bg-background-primary/92 px-10">
          <FontAwesome6
            name="map-location-dot"
            size={22}
            color={themeColors.text.tertiary}
          />
          <Text className="text-center font-body text-sm text-text-secondary">
            Bu filtrelere uygun konumlu etkinlik yok.
          </Text>
        </View>
      ) : null}

      {selectedEvent ? (
        <EventMapPreviewCard
          key={selectedEvent.id}
          event={selectedEvent}
          onClose={() => setSelectedId(null)}
          onPress={() => onOpenEvent(selectedEvent.id)}
        />
      ) : null}
    </View>
  );
}

function EventMapPin({
  icon,
  accent,
  active,
}: {
  icon: IconName;
  accent: string;
  active: boolean;
}) {
  return (
    <View className="items-center">
      <View
        className={`h-10 w-10 items-center justify-center rounded-full border-2 bg-background-primary ${
          active ? "border-brand-primary" : "border-white/25"
        }`}
      >
        <FontAwesome6 name={icon} size={15} color={accent} />
      </View>
      <View
        className="-mt-1 h-2 w-2 rotate-45"
        style={{
          backgroundColor: active
            ? themeColors.brand.primary
            : "rgba(255,255,255,0.25)",
        }}
      />
    </View>
  );
}

function EventMapPreviewCard({
  event,
  onClose,
  onPress,
}: {
  event: EventSummary;
  onClose: () => void;
  onPress: () => void;
}) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const photo = resolveEventPhoto(event.sportCoverImageUrl);
  const badge = relativeEventBadge(event.eventDate);
  const time = formatEventTime(event.eventDate);
  const whenLabel = [badge, time].filter(Boolean).join(" · ");
  const place = event.location.trim();
  const sportLabel = event.sportName.trim().toLocaleUpperCase("tr-TR");

  return (
    <Animated.View
      entering={FadeInUp.duration(220)}
      className="absolute inset-x-3 bottom-3"
      style={shadows.lg}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${event.title} detayına git`}
        onPress={onPress}
        className="h-[136px] overflow-hidden rounded-[22px] border border-border-default active:opacity-90"
      >
        <ImageBackground
          source={photoFailed ? FALLBACK_SPORT_IMAGE : photo}
          resizeMode="cover"
          onError={() => setPhotoFailed(true)}
          style={{ flex: 1 }}
        >
          <View
            pointerEvents="none"
            className="absolute inset-0 bg-black/55"
          />

          <View className="flex-1 justify-between p-3.5">
            {sportLabel ? (
              <View className="flex-row items-center self-start rounded-pill bg-white/90 px-2 py-1">
                <Text className="font-body text-[10px] font-bold tracking-[1.2px] text-text-secondary">
                  {sportLabel}
                </Text>
              </View>
            ) : (
              <View />
            )}

            <View className="flex-row items-end justify-between gap-2">
              <View className="min-w-0 flex-1 gap-1">
                <Text
                  numberOfLines={1}
                  className="font-display text-[17px] text-white"
                >
                  {event.title.trim() || "Etkinlik"}
                </Text>
                {place ? (
                  <View className="flex-row items-center gap-1.5">
                    <FontAwesome6
                      name="location-dot"
                      size={9}
                      color="rgba(255,255,255,0.75)"
                    />
                    <Text
                      numberOfLines={1}
                      className="flex-1 font-body text-xs text-white/75"
                    >
                      {place}
                    </Text>
                  </View>
                ) : null}
                {whenLabel ? (
                  <Text className="font-mono text-[11px] text-white/75">
                    {whenLabel}
                  </Text>
                ) : null}
              </View>

              <View className="h-8 w-8 items-center justify-center rounded-full bg-white/15">
                <FontAwesome6 name="chevron-right" size={12} color="#fff" />
              </View>
            </View>
          </View>
        </ImageBackground>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Önizlemeyi kapat"
        onPress={onClose}
        hitSlop={8}
        className="absolute -top-3 -right-1 h-7 w-7 items-center justify-center rounded-full border border-border-default bg-background-primary active:opacity-80"
      >
        <FontAwesome6
          name="xmark"
          size={11}
          color={themeColors.text.secondary}
        />
      </Pressable>
    </Animated.View>
  );
}
