import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Mapbox from "@rnmapbox/maps";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import { Pressable, useWindowDimensions, View } from "react-native";
import { useTranslation } from "react-i18next";

import { MAPBOX_STYLE_URL, toMapboxCoord } from "@/constants/map";
import { shadows, sportAccentToken, themeColors } from "@/constants/theme";
import type {
  UserCoordinates,
  UserLocationStatus,
} from "@/features/location/hooks/use-user-location";
import { hasMapboxToken, zoomForLongitudeSpan } from "@/lib/mapbox";
import { AppText as Text, MapUnavailable } from "@/components";
import type { IconName } from "@/types/components";
import type { EventSummary } from "@/features/events/types";
import { cameraForPoints } from "./map-camera";
import {
  CurrentLocationPin,
  EventMapPin,
  EventMapPreviewCard,
} from "./event-map-pins";

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

/** rnmapbox OnPressEvent'i paket kokunden export etmiyor; tipten turetiyoruz. */
type ShapePressEvent = Parameters<
  NonNullable<ComponentProps<typeof Mapbox.ShapeSource>["onPress"]>
>[0];

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
          properties: {
            id: event.id,
            pinKey: pinKeyFor(event.sportIcon, accent),
          },
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
              circleRadius: [
                "step",
                ["get", "point_count"],
                16,
                10,
                20,
                50,
                26,
              ],
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
