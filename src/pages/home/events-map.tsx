import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useMemo, useRef, useState } from "react";
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
import type { UserCoordinates, UserLocationStatus } from "@/hooks/use-user-location";
import { isGooglePlacesEnabled } from "@/services/location-service";
import type { IconName } from "@/types/components";
import type { EventSummary } from "@/types/events";
import { formatEventTime, relativeEventBadge } from "@/utils/events";

type EventsMapProps = {
  events: EventSummary[];
  onOpenEvent: (eventId: string) => void;
  /** Kullanıcının mevcut konumu; ayrı bir marker olarak gösterilir. */
  userLocation?: UserCoordinates | null;
  locationStatus?: UserLocationStatus;
  /** Konum izni yoksa istemek, reddedilmişse ayarlara götürmek için. */
  onRequestLocation?: () => void;
};

function regionForPoints(
  points: { latitude: number; longitude: number }[],
): Region {
  if (points.length === 0) {
    return MAP_INITIAL_REGION;
  }

  if (points.length === 1) {
    return {
      latitude: points[0].latitude,
      longitude: points[0].longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }

  let minLat = points[0].latitude;
  let maxLat = points[0].latitude;
  let minLng = points[0].longitude;
  let maxLng = points[0].longitude;

  for (const point of points) {
    minLat = Math.min(minLat, point.latitude);
    maxLat = Math.max(maxLat, point.latitude);
    minLng = Math.min(minLng, point.longitude);
    maxLng = Math.max(maxLng, point.longitude);
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

export function EventsMap({
  events,
  onOpenEvent,
  userLocation = null,
  locationStatus = "idle",
  onRequestLocation,
}: EventsMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const useGoogleMaps = isGooglePlacesEnabled();
  const mapRef = useRef<MapView>(null);

  const located = useMemo(
    () =>
      events.filter(
        (event) =>
          Number.isFinite(event.latitude) && Number.isFinite(event.longitude),
      ),
    [events],
  );

  // İlk kadraj kullanıcıyı da kapsasın: "ben neredeyim, etkinlikler nerede"
  // sorusunun cevabı tek bakışta görünsün. MapView `initialRegion`'ı yalnızca
  // ilk render'da okur; sonraki değişimler haritayı kullanıcının altından
  // kaydırmaz, yeniden ortalamak için sağ alttaki düğme var.
  const initialRegion = useMemo(
    () => regionForPoints(userLocation ? [...located, userLocation] : located),
    [located, userLocation],
  );

  const selectedEvent =
    located.find((event) => event.id === selectedId) ?? null;

  const centerOnUser = () => {
    if (!userLocation) {
      onRequestLocation?.();
      return;
    }

    mapRef.current?.animateToRegion(
      {
        ...userLocation,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      },
      350,
    );
  };

  return (
    <View className="h-[560px] overflow-hidden rounded-xlarge border border-border-default">
      <MapView
        ref={mapRef}
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
        {userLocation ? (
          <Marker
            coordinate={userLocation}
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={1}
            title="Mevcut konumun"
            tracksViewChanges={false}
          >
            <CurrentLocationPin />
          </Marker>
        ) : null}

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
        // Tam ekran örtü yerine üstte şerit: kullanıcının kendi konum
        // marker'ı boş sonuçta da görünür kalsın.
        <View
          pointerEvents="none"
          className="absolute inset-x-3 top-3 flex-row items-center gap-2 rounded-2xl border border-border-default bg-background-primary/92 px-3 py-2.5"
        >
          <FontAwesome6
            name="map-location-dot"
            size={13}
            color={themeColors.text.tertiary}
          />
          <Text className="flex-1 font-body text-xs text-text-secondary">
            Bu filtrelere uygun konumlu etkinlik yok.
          </Text>
        </View>
      ) : null}

      {selectedEvent ? null : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            userLocation ? "Konumuma odaklan" : "Konum iznini aç"
          }
          onPress={centerOnUser}
          disabled={locationStatus === "loading"}
          className="absolute right-3 bottom-3 h-11 w-11 items-center justify-center rounded-full border border-border-default bg-background-primary/92 active:opacity-80"
          style={shadows.md}
        >
          <FontAwesome6
            name={userLocation ? "location-crosshairs" : "location-dot"}
            size={15}
            color={
              userLocation
                ? themeColors.brand.primary
                : themeColors.text.tertiary
            }
          />
        </Pressable>
      )}

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

/**
 * Kullanıcının kendi konumu. Spor pinlerinden kasıtlı olarak farklı bir
 * biçimde: yuvarlak nokta + hale, ikon yok — böylece etkinlik pinleriyle
 * karıştırılmaz.
 */
function CurrentLocationPin() {
  return (
    <View className="h-8 w-8 items-center justify-center">
      <View
        className="absolute h-8 w-8 rounded-full"
        style={{ backgroundColor: `${themeColors.brand.primary}33` }}
      />
      <View
        className="h-3.5 w-3.5 rounded-full border-2 border-white"
        style={{ backgroundColor: themeColors.brand.primary }}
      />
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
