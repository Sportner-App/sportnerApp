import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Mapbox from "@rnmapbox/maps";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import {
  ImageBackground,
  Pressable,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import {
  MAP_INITIAL_CAMERA,
  MAPBOX_STYLE_URL,
  toMapboxCoord,
} from "@/constants/map";
import {
  FALLBACK_SPORT_IMAGE,
  resolveEventPhoto,
} from "@/constants/sport-images";
import { shadows, sportAccentToken, themeColors } from "@/constants/theme";
import type {
  UserCoordinates,
  UserLocationStatus,
} from "@/hooks/use-user-location";
import { hasMapboxToken, zoomForLongitudeSpan } from "@/services/mapbox";
import { MapUnavailable } from "@/components";
import type { IconName } from "@/types/components";
import type { EventSummary } from "@/types/events";
import {
  currentDateLocale,
  formatEventTime,
  relativeEventBadge,
} from "@/utils/events";
import { AppText as Text } from "@/components/app-text";

type EventsMapProps = {
  events: EventSummary[];
  onOpenEvent: (eventId: string) => void;
  /** Seçiliyse kamera yalnızca filtrelenen şehirdeki etkinliklere odaklanır. */
  focusedCity?: string | null;
  /** Kullanıcının mevcut konumu; ayrı bir marker olarak gösterilir. */
  userLocation?: UserCoordinates | null;
  locationStatus?: UserLocationStatus;
  /** Konum izni yoksa istemek, reddedilmişse ayarlara götürmek için. */
  onRequestLocation?: () => void;
};

type Coordinate = { latitude: number; longitude: number };

/** rnmapbox OnPressEvent'i paket kokunden export etmiyor; tipten turetiyoruz. */
type ShapePressEvent = Parameters<
  NonNullable<ComponentProps<typeof Mapbox.ShapeSource>["onPress"]>
>[0];

/**
 * Kamerayı etkinliklerin üstüne oturtan sınırlar. Eski region hesabındaki
 * `delta * 1.6` payı yerine Mapbox'ın kendi padding'ini kullanıyoruz: üstteki
 * filtre şeridi ve alttaki önizleme kartı gerçek piksel değerleriyle hesaba
 * katıldığı için pinler artık arayüzün altında kalmıyor.
 */
const BOUNDS_PADDING = {
  paddingTop: 96,
  paddingBottom: 160,
  paddingLeft: 48,
  paddingRight: 48,
};

function boundsForPoints(points: Coordinate[]) {
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

  return {
    ne: [maxLng, maxLat] as [number, number],
    sw: [minLng, minLat] as [number, number],
    ...BOUNDS_PADDING,
  };
}

/**
 * Cluster ayarları. clusterMaxZoomLevel'ın üstünde pinler tek tek görünür;
 * mahalle ölçeğinde (z14) artık gruplamanın anlamı kalmıyor.
 */
const CLUSTER_RADIUS = 60;
const CLUSTER_MAX_ZOOM = 14;

/** Bir etkinliğin hangi pin görselini kullanacağı. İkon + aksan rengi çifti. */
function pinKeyFor(icon: string, accent: string) {
  return `pin|${icon}|${accent}`;
}

/** Tek nokta / boş liste sınır hesabına uygun değil; merkez + zoom'a düşer. */
function cameraForPoints(points: Coordinate[], singleZoom: number) {
  if (points.length === 0) {
    return {
      centerCoordinate: [...MAP_INITIAL_CAMERA.centerCoordinate],
      zoomLevel: MAP_INITIAL_CAMERA.zoomLevel,
    };
  }

  if (points.length === 1) {
    return {
      centerCoordinate: toMapboxCoord(points[0]),
      zoomLevel: singleZoom,
    };
  }

  return { bounds: boundsForPoints(points) };
}

export function EventsMap({
  events,
  onOpenEvent,
  focusedCity = null,
  userLocation = null,
  locationStatus = "idle",
  onRequestLocation,
}: EventsMapProps) {
  const { t } = useTranslation("home");
  const { t: tLocation } = useTranslation("location");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const cameraRef = useRef<Mapbox.Camera>(null);
  const shapeRef = useRef<Mapbox.ShapeSource>(null);
  const { width: screenWidth } = useWindowDimensions();

  // Eski MapView delta'larının zoom karşılıkları; yakınlık birebir korunsun
  // diye ekran genişliğinden türetiliyor.
  const zoomNearby = zoomForLongitudeSpan(0.08, screenWidth);
  const zoomRecenter = zoomForLongitudeSpan(0.03, screenWidth);
  const zoomSingle = zoomForLongitudeSpan(0.05, screenWidth);

  const located = useMemo(
    () =>
      events.filter(
        (event) =>
          Number.isFinite(event.latitude) && Number.isFinite(event.longitude),
      ),
    [events],
  );

  // Filtresiz keşifte uzak etkinlikler kamerayı ülke ölçeğine açmasın: konum
  // varsa ilk bakış kullanıcının yakın çevresine odaklanır. Şehir seçildiğinde
  // kamera o şehirde dönen etkinlikleri kapsar. Konum yoksa etkinliklerden
  // hesaplanan bölge güvenli fallback olarak kullanılır.
  const initialCamera = useMemo(() => {
    if (focusedCity) {
      return cameraForPoints(located, zoomSingle);
    }

    if (userLocation) {
      return {
        centerCoordinate: toMapboxCoord(userLocation),
        zoomLevel: zoomNearby,
      };
    }

    return cameraForPoints(located, zoomSingle);
  }, [focusedCity, located, userLocation, zoomNearby, zoomSingle]);

  const selectedEvent =
    located.find((event) => event.id === selectedId) ?? null;

  /**
   * Pinler artık RN view değil, harita sembolü — yüzlerce etkinlikte kaydırma
   * takılmasın diye. Her (ikon, renk) çifti bir kez görsele çevrilip atlasa
   * yükleniyor; EventMapPin olduğu gibi kullanıldığı için tasarım değişmiyor.
   * Yalnızca ekranda gerçekten bulunan sporlar kaydediliyor.
   */
  const pinImages = useMemo(() => {
    const seen = new Map<string, { icon: IconName; accent: string }>();

    for (const event of located) {
      const accent =
        sportAccentToken(event.sport)?.accent ?? themeColors.brand.primary;
      const key = pinKeyFor(event.sportIcon, accent);

      if (!seen.has(key)) {
        seen.set(key, { icon: event.sportIcon, accent });
      }
    }

    return [...seen.entries()];
  }, [located]);

  const eventShape = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point>>(
    () => ({
      type: "FeatureCollection",
      features: located.map((event) => {
        const accent =
          sportAccentToken(event.sport)?.accent ?? themeColors.brand.primary;

        return {
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: toMapboxCoord(event),
          },
          // Cluster'lama feature.id'yi koruma garantisi vermiyor; id'yi
          // properties içinde taşıyoruz.
          properties: { id: event.id, pinKey: pinKeyFor(event.sportIcon, accent) },
        };
      }),
    }),
    [located],
  );

  /**
   * ShapeSource dokunması haritanın kendi onPress'ini de tetikleyebiliyor;
   * o da seçimi hemen temizlerdi. Sembol dokunuşundan hemen sonraki harita
   * dokunuşunu yok sayıyoruz.
   */
  const shapePressedAt = useRef(0);

  const handleShapePress = async (pressEvent: ShapePressEvent) => {
    shapePressedAt.current = Date.now();
    const feature = pressEvent.features[0];

    if (!feature) {
      return;
    }

    // Cluster'a dokunulduysa seçim yapmak yerine içini açacak kadar yakınlaş.
    if (feature.properties?.point_count) {
      const zoom = await shapeRef.current?.getClusterExpansionZoom(feature);

      if (zoom != null && feature.geometry.type === "Point") {
        cameraRef.current?.setCamera({
          centerCoordinate: feature.geometry.coordinates as [number, number],
          zoomLevel: zoom,
          animationDuration: 350,
        });
      }

      return;
    }

    const id = feature.properties?.id;

    if (typeof id === "string") {
      setSelectedId(id);
    }
  };

  useEffect(() => {
    if (!isMapReady || focusedCity || !userLocation) {
      return;
    }

    cameraRef.current?.setCamera({
      centerCoordinate: toMapboxCoord(userLocation),
      zoomLevel: zoomNearby,
      animationDuration: 350,
    });
  }, [focusedCity, isMapReady, userLocation, zoomNearby]);

  /**
   * Şehir filtresi seçilince kamera o şehrin etkinliklerini kapsasın.
   * Eskiden kamera yalnızca mount anında kuruluyordu, yani şehir değiştirmek
   * görünümü hiç oynatmıyordu — kullanıcı elle kaydırmak zorundaydı.
   *
   * Şehir başına bir kez çalışır: etkinlikler her yenilendiğinde tetiklenirse
   * kullanıcı haritayı kaydırırken kamera geri zıplardı. Liste henüz boşsa
   * beklenir, çünkü şehir seçimiyle birlikte etkinlikler yeniden çekiliyor.
   */
  const fittedCityRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isMapReady) {
      return;
    }

    if (!focusedCity) {
      fittedCityRef.current = null;
      return;
    }

    if (fittedCityRef.current === focusedCity || located.length === 0) {
      return;
    }

    fittedCityRef.current = focusedCity;
    cameraRef.current?.setCamera({
      ...cameraForPoints(located, zoomSingle),
      animationDuration: 350,
    });
  }, [focusedCity, isMapReady, located, zoomSingle]);

  const centerOnUser = () => {
    if (!userLocation) {
      onRequestLocation?.();
      return;
    }

    cameraRef.current?.setCamera({
      centerCoordinate: toMapboxCoord(userLocation),
      zoomLevel: zoomRecenter,
      animationDuration: 350,
    });
  };

  if (!hasMapboxToken()) {
    return (
      <View className="flex-1 overflow-hidden rounded-xlarge border border-border-default">
        <MapUnavailable message={tLocation("mapUnavailable")} />
      </View>
    );
  }

  return (
    <View className="flex-1 overflow-hidden rounded-xlarge border border-border-default">
      <Mapbox.MapView
        style={{ flex: 1 }}
        styleURL={MAPBOX_STYLE_URL}
        scaleBarEnabled={false}
        compassEnabled={false}
        // Mapbox kullanım şartları etkileşimli haritada wordmark ve atıf
        // gösterilmesini zorunlu tutuyor; alttaki önizleme kartının altında
        // kalmasın diye sola yaslandı.
        logoPosition={{ bottom: 8, left: 8 }}
        attributionPosition={{ bottom: 8, left: 92 }}
        onDidFinishLoadingMap={() => setIsMapReady(true)}
        onPress={() => {
          if (Date.now() - shapePressedAt.current < 300) {
            return;
          }

          setSelectedId(null);
        }}
      >
        <Mapbox.Camera ref={cameraRef} defaultSettings={initialCamera} />

        <Mapbox.Images>
          {pinImages.map(([key, { icon, accent }]) => (
            <Mapbox.Image key={key} name={key}>
              {/* collapsable={false} şart: EventMapPin'in kök View'ı yalnızca
                  hizalama taşıdığı için RN onu eleyip iki alt view'ı doğrudan
                  RNMBXImage'a veriyor ("expected a single subview"), pin
                  görseli de bozuk üretiliyor. */}
              <View collapsable={false}>
                <EventMapPin icon={icon} accent={accent} active={false} />
              </View>
            </Mapbox.Image>
          ))}
        </Mapbox.Images>

        <Mapbox.ShapeSource
          id="events"
          ref={shapeRef}
          shape={eventShape}
          cluster
          clusterRadius={CLUSTER_RADIUS}
          clusterMaxZoomLevel={CLUSTER_MAX_ZOOM}
          onPress={handleShapePress}
        >
          <Mapbox.CircleLayer
            id="event-cluster-bubble"
            filter={["has", "point_count"]}
            style={{
              // Pin'lerle aynı dil: koyu zemin + marka konturu.
              circleColor: themeColors.background.primary,
              circleOpacity: 0.95,
              circleStrokeWidth: 2,
              circleStrokeColor: themeColors.brand.primary,
              circleRadius: ["step", ["get", "point_count"], 16, 10, 20, 50, 26],
            }}
          />

          <Mapbox.SymbolLayer
            id="event-cluster-count"
            filter={["has", "point_count"]}
            style={{
              textField: ["get", "point_count_abbreviated"],
              textFont: ["DIN Pro Bold", "Arial Unicode MS Bold"],
              textSize: 13,
              textColor: themeColors.brand.primary,
              textAllowOverlap: true,
              textIgnorePlacement: true,
            }}
          />

          <Mapbox.SymbolLayer
            id="event-pin"
            // Seçili pin ayrı bir MarkerView olarak üstte çiziliyor; burada
            // iki kez görünmesin diye dışarıda bırakılıyor.
            filter={[
              "all",
              ["!", ["has", "point_count"]],
              ["!=", ["get", "id"], selectedId ?? ""],
            ]}
            style={{
              iconImage: ["get", "pinKey"],
              iconAnchor: "bottom",
              iconAllowOverlap: true,
              iconIgnorePlacement: true,
            }}
          />
        </Mapbox.ShapeSource>

        {selectedEvent ? (
          <Mapbox.MarkerView
            id="selected-event"
            coordinate={toMapboxCoord(selectedEvent)}
            anchor={{ x: 0.5, y: 1 }}
            allowOverlap
          >
            <EventMapPin
              icon={selectedEvent.sportIcon}
              accent={
                sportAccentToken(selectedEvent.sport)?.accent ??
                themeColors.brand.primary
              }
              active
            />
          </Mapbox.MarkerView>
        ) : null}

        {/* Etkinliklerden SONRA: MarkerView'da zIndex yok, üstte kalması için
            en son render edilmesi gerekiyor. Eskiden Marker zIndex={1} ile
            aynı sonucu veriyordu. */}
        {userLocation ? (
          <Mapbox.MarkerView
            id="user-location"
            coordinate={toMapboxCoord(userLocation)}
            anchor={{ x: 0.5, y: 0.5 }}
            allowOverlap
          >
            <View accessibilityLabel={t("map.currentLocationTitle")}>
              <CurrentLocationPin />
            </View>
          </Mapbox.MarkerView>
        ) : null}
      </Mapbox.MapView>

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
          <Text className="flex-1 font-body text-caption text-text-secondary">
            {t("map.noResults")}
          </Text>
        </View>
      ) : null}

      {selectedEvent ? null : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            userLocation
              ? t("map.recenterAccessibility")
              : t("map.enableLocationAccessibility")
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
  const { t } = useTranslation("home");
  const [photoFailed, setPhotoFailed] = useState(false);
  const photo = resolveEventPhoto(event.sportCoverImageUrl);
  const badge = relativeEventBadge(event.eventDate);
  const time = formatEventTime(event.eventDate);
  const whenLabel = [badge, time].filter(Boolean).join(" · ");
  const place = event.location.trim();
  const sportLabel = event.sportName
    .trim()
    .toLocaleUpperCase(currentDateLocale());
  const accent = sportAccentToken(event.sport);
  const sportColor = accent?.accent ?? themeColors.text.secondary;
  const onAccent = accent?.onAccent ?? themeColors.text.inverse;

  return (
    <Animated.View
      entering={FadeInUp.duration(220)}
      className="absolute inset-x-3 bottom-3"
      style={shadows.lg}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("map.openPreviewAccessibility", {
          title: event.title,
        })}
        onPress={onPress}
        className="h-[136px] overflow-hidden rounded-[22px] border border-border-default active:opacity-90"
      >
        <ImageBackground
          source={photoFailed ? FALLBACK_SPORT_IMAGE : photo}
          resizeMode="cover"
          onError={() => setPhotoFailed(true)}
          style={{ flex: 1 }}
        >
          <View pointerEvents="none" className="absolute inset-0 bg-black/55" />

          <View className="flex-1 justify-between p-3.5">
            {sportLabel ? (
              <View
                className="flex-row items-center self-start rounded-pill px-2 py-1"
                style={{ backgroundColor: sportColor }}
              >
                <Text
                  className="font-body-bold text-overline tracking-[1.2px]"
                  style={{ color: onAccent }}
                >
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
                  className="font-display text-body-lg text-white"
                >
                  {event.title.trim() || t("eventCard.untitled")}
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
                      className="flex-1 font-body text-caption text-white/75"
                    >
                      {place}
                    </Text>
                  </View>
                ) : null}
                {whenLabel ? (
                  <Text className="font-body-bold text-overline text-white/75">
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
        accessibilityLabel={t("map.closePreviewAccessibility")}
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
