import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { SegmentedTabs, SportLoader, TabPage } from "@/components";
import { shadows, themeColors } from "@/constants/theme";
import { useAuth } from "@/contexts";
import {
  DEFAULT_EVENT_FILTERS,
  type EventFeedScope,
  useEvents,
} from "@/hooks/use-events";
import { useMyOrganizations } from "@/hooks/use-organizations";
import { useSportCatalog } from "@/hooks/use-sport-catalog";
import { useSportCategories } from "@/hooks/use-sport-categories";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useUserLocation } from "@/hooks/use-user-location";
import { ORGANIZATION_STATUS } from "@/types/organizations";

import { EventCard } from "./event-card";
import { EventFilterSheet } from "./event-filter-sheet";
import { EventsMap } from "./events-map";
import { Hero } from "./hero";
import { SportFilter } from "./sport-filter";

type ViewMode = "list" | "map";

/**
 * The list isn't virtualized (plain ScrollView + .map, so onEndReached-based
 * pagination keeps working), which means every fetched event mounts at once.
 * Each EventCard runs its own FadeInDown entrance animation on mount; staggering
 * dozens of them simultaneously can overwhelm the UI thread and leave a card
 * stuck in its pre-animation (invisible) state — a blank gap where the card
 * should be, until something forces a fresh mount. Only entrance-animate the
 * cards that are actually visible when the list first renders.
 */
const MAX_ENTRANCE_ANIMATED_CARDS = 6;

export function HomeScreen() {
  const { t } = useTranslation("home");
  const { t: tTabs } = useTranslation("tabs");
  const router = useRouter();
  const { scope: scopeParam, organizationId: organizationIdParam } =
    useLocalSearchParams<{ scope?: string; organizationId?: string }>();
  const initialScope: EventFeedScope =
    scopeParam === "friends" || scopeParam === "organizations"
      ? scopeParam
      : "all";
  const initialOrganizationId =
    initialScope === "organizations" ? (organizationIdParam ?? null) : null;
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const { requireAuth } = useRequireAuth();
  const { isAuthenticated } = useAuth();
  const { items: myOrganizations, isLoading: isOrganizationsLoading } =
    useMyOrganizations(isAuthenticated);
  const { categories: sportCategories } = useSportCategories();
  const { sports } = useSportCatalog();
  const {
    coordinates: userLocation,
    status: locationStatus,
    request: requestLocation,
  } = useUserLocation();
  const {
    events,
    totalCount,
    isLoading,
    isRefreshing,
    isLoadingMore,
    categoryFilter,
    setCategoryFilter,
    scope,
    setScope,
    filters,
    applyFilters,
    refresh,
    loadMore,
  } = useEvents(initialScope, initialOrganizationId, userLocation);

  const approvedOrganizations = myOrganizations.filter(
    (organization) => organization.status === ORGANIZATION_STATUS.approved,
  );
  const hasOrganizations = approvedOrganizations.length > 0;
  const selectedOrganizationName = approvedOrganizations.find(
    (organization) => organization.id === filters.organizationId,
  )?.name;

  useEffect(() => {
    if (
      scope === "organizations" &&
      !isOrganizationsLoading &&
      !hasOrganizations
    ) {
      setScope("all");
    }
  }, [hasOrganizations, isOrganizationsLoading, scope, setScope]);

  useEffect(() => {
    if (
      filters.organizationId &&
      !isOrganizationsLoading &&
      !approvedOrganizations.some(
        (organization) => organization.id === filters.organizationId,
      )
    ) {
      applyFilters({ ...filters, organizationId: null });
    }
  }, [applyFilters, approvedOrganizations, filters, isOrganizationsLoading]);

  const isFriends = scope === "friends";
  const isOrganizations = scope === "organizations";
  const hasActiveFilters =
    filters.city != null ||
    filters.minAge !== DEFAULT_EVENT_FILTERS.minAge ||
    filters.maxAge !== DEFAULT_EVENT_FILTERS.maxAge ||
    filters.gender != null ||
    filters.skillLevel != null ||
    filters.isPaid != null ||
    filters.organizationId != null ||
    filters.sportId != null;

  const viewModeToggle = (
    <View className="flex-row items-center gap-1 rounded-full border border-border-default bg-background-secondary p-1">
      <ViewModeButton
        icon="list"
        label={t("viewMode.list")}
        active={viewMode === "list"}
        onPress={() => setViewMode("list")}
      />
      <ViewModeButton
        icon="map-location-dot"
        label={t("viewMode.map")}
        active={viewMode === "map"}
        onPress={() => setViewMode("map")}
      />
    </View>
  );

  const filterButtons = (
    <>
      {hasActiveFilters ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("filters.clearAccessibility")}
          onPress={() => applyFilters(DEFAULT_EVENT_FILTERS)}
          className="h-11 w-11 items-center justify-center rounded-full active:opacity-70"
        >
          <FontAwesome6
            name="filter-circle-xmark"
            size={17}
            color={themeColors.text.secondary}
          />
        </Pressable>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("filters.accessibility")}
        onPress={() => setFilterOpen(true)}
        className="h-11 w-11 items-center justify-center rounded-full active:opacity-70"
      >
        <FontAwesome6 name="sliders" size={17} color={themeColors.text.primary} />
        {hasActiveFilters ? (
          <View className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background-primary bg-brand-primary" />
        ) : null}
      </Pressable>
    </>
  );

  const filterSheet = (
    <EventFilterSheet
      visible={filterOpen}
      filters={filters}
      onClose={() => setFilterOpen(false)}
      onApply={applyFilters}
      organizations={isOrganizations ? approvedOrganizations : []}
      sports={sports}
    />
  );

  if (viewMode === "map") {
    // Full-screen map: a fixed-height map buried under Hero/filters/list controls
    // in a scrolling page meant the tapped-marker preview card could render
    // below the visible viewport, forcing a scroll to see it. The map now fills
    // the whole screen and the controls float on top of it instead, so the
    // preview card (anchored to the bottom of the map's own box) is always
    // inside the visible area no matter where on the map it was opened.
    return (
      <TabPage refreshing={isRefreshing} onRefresh={refresh} scroll={false}>
        <View className="flex-1">
          <View className="flex-1">
            {isLoading ? (
              <View className="flex-1 items-center justify-center">
                <SportLoader size={148} label={t("loadingEvents")} />
              </View>
            ) : (
              <EventsMap
                events={events}
                onOpenEvent={(eventId) => router.push(`/events/${eventId}`)}
                userLocation={userLocation}
                locationStatus={locationStatus}
                onRequestLocation={() => void requestLocation()}
              />
            )}
          </View>

          <Animated.View
            entering={FadeInDown.duration(400)}
            pointerEvents="box-none"
            className="absolute inset-x-3 top-3"
          >
            <View
              className="gap-sm rounded-[24px] border border-border-default bg-background-primary/80 p-3"
              style={shadows.md}
            >
              <View className="flex-row items-center justify-between">
                <Text className="font-display text-[18px] leading-[24px] text-text-primary">
                  {tTabs("events")}
                </Text>
                <View className="flex-row items-center gap-sm">
                  {viewModeToggle}
                  {filterButtons}
                </View>
              </View>

              <SportFilter
                categories={sportCategories}
                value={categoryFilter}
                onChange={setCategoryFilter}
              />
            </View>
          </Animated.View>
        </View>

        {filterSheet}
      </TabPage>
    );
  }

  return (
    <TabPage
      refreshing={isRefreshing}
      onRefresh={refresh}
      onEndReached={loadMore}
    >
      <Hero
        onCreatePress={() =>
          requireAuth(tTabs("requireAuth.create")) &&
          router.push("/events/create")
        }
      />

      <Animated.View
        entering={FadeInDown.duration(500).delay(60)}
        className="gap-md"
      >
        <View className="flex-row items-center justify-between">
          <Text className="font-display text-[24px] leading-[30px] text-text-primary">
            {tTabs("events")}
          </Text>
          <View className="flex-row items-center gap-sm">
            {viewModeToggle}
            {filterButtons}
          </View>
        </View>

        <SegmentedTabs
          options={[
            { key: "all", label: t("scope.all") },
            { key: "friends", label: t("scope.friends") },
            ...(hasOrganizations
              ? [{ key: "organizations", label: t("scope.organizations") } as const]
              : []),
          ]}
          value={scope}
          onChange={(next) => {
            if (
              (next === "friends" || next === "organizations") &&
              !requireAuth(
                next === "friends"
                  ? t("requireAuth.friends")
                  : t("requireAuth.organizations"),
              )
            ) {
              return;
            }
            setScope(next);
          }}
        />

        <View className="flex-row items-center gap-sm">
          <FontAwesome6
            name={
              isOrganizations
                ? "building"
                : isFriends
                  ? "user-group"
                  : "location-dot"
            }
            size={14}
            color={themeColors.text.primary}
          />
          <Text className="font-body-bold text-[15px] text-text-primary">
            {isOrganizations
              ? (selectedOrganizationName ?? t("contextLabel.organizationsFallback"))
              : isFriends
                ? filters.city
                  ? t("contextLabel.friendsWithCity", { city: filters.city })
                  : t("contextLabel.friends")
                : filters.city
                  ? t("contextLabel.cityEvents", { city: filters.city })
                  : t("contextLabel.allCities")}
          </Text>
        </View>

        <SportFilter
          categories={sportCategories}
          value={categoryFilter}
          onChange={setCategoryFilter}
        />
        <Text className="font-mono text-caption text-text-tertiary">
          {t("resultCount", { count: totalCount })}
        </Text>
      </Animated.View>

      {isLoading ? (
        <View className="items-center py-3xl">
          <SportLoader size={148} label={t("loadingEvents")} />
        </View>
      ) : events.length === 0 ? (
        <View className="items-center gap-sm rounded-xlarge border border-border-default bg-surface-primary px-xl py-3xl">
          <FontAwesome6
            name="calendar-xmark"
            size={22}
            color={themeColors.text.secondary}
          />
          <Text className="text-center font-body text-body-sm text-text-secondary">
            {isOrganizations
              ? t("empty.organizations")
              : isFriends
                ? t("empty.friends")
                : t("empty.default")}
          </Text>
        </View>
      ) : (
        <View className="gap-lg">
          {events.map((event, index) => (
            <EventCard
              key={event.id}
              event={event}
              index={index}
              animateEntrance={index < MAX_ENTRANCE_ANIMATED_CARDS}
              onPress={() => router.push(`/events/${event.id}`)}
            />
          ))}
          {isLoadingMore ? (
            <View className="items-center py-5">
              <SportLoader size={64} label={t("loadingEvents")} />
            </View>
          ) : null}
        </View>
      )}

      {filterSheet}
    </TabPage>
  );
}

function ViewModeButton({
  icon,
  label,
  active,
  onPress,
}: {
  icon: "list" | "map-location-dot";
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      className={`h-9 w-9 items-center justify-center rounded-full active:opacity-80 ${
        active ? "bg-brand-primary" : ""
      }`}
    >
      <FontAwesome6
        name={icon}
        size={14}
        color={active ? themeColors.text.onPrimary : themeColors.text.secondary}
      />
    </Pressable>
  );
}
