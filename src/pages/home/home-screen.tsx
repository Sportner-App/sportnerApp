import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import {
  SegmentedTabs,
  SportLoader,
  TabPage,
  TabScreenHeader,
} from "@/components";
import { shadows, themeColors } from "@/constants/theme";
import { useAuth } from "@/contexts";
import { useCities } from "@/hooks/use-cities";
import {
  DEFAULT_EVENT_FILTERS,
  type EventFeedScope,
  useEvents,
} from "@/hooks/use-events";
import { useMyOrganizations } from "@/hooks/use-organizations";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useSportCatalog } from "@/hooks/use-sport-catalog";
import { useUserLocation } from "@/hooks/use-user-location";
import { ORGANIZATION_STATUS } from "@/types/organizations";

import { subscribeToHomeListView } from "@/components/glass-tab-bar";

import { EventCard } from "./event-card";
import { EventFilterSheet } from "./event-filter-sheet";
import { EventsMap } from "./events-map";
import { AppText as Text } from "@/components/app-text";

type ViewMode = "list" | "map";

export function HomeScreen() {
  const { t } = useTranslation("home");
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

  useEffect(() => subscribeToHomeListView(() => setViewMode("list")), []);
  const { isAuthenticated } = useAuth();
  const { items: myOrganizations, isLoading: isOrganizationsLoading } =
    useMyOrganizations(isAuthenticated);
  const { sports } = useSportCatalog();
  const { options: cityOptions, isLoading: isCitiesLoading } = useCities();
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
  const isFriends = scope === "friends";
  const isOrganizations = scope === "organizations";
  const toggleSort = () =>
    applyFilters({
      ...filters,
      sortBy: filters.sortBy === "time" ? "location" : "time",
    });

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
        label={t("viewMode.listAccessibility")}
        text={t("viewMode.list")}
        active={viewMode === "list"}
        onPress={() => setViewMode("list")}
      />
      <ViewModeButton
        icon="map-location-dot"
        label={t("viewMode.mapAccessibility")}
        text={t("viewMode.map")}
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
        className="h-11 flex-row items-center gap-2 rounded-xl border border-border-default bg-surface-primary px-4 active:opacity-70"
      >
        <FontAwesome6
          name="filter"
          size={14}
          color={themeColors.text.primary}
        />
        <Text className="font-body-bold text-body-sm text-text-primary">
          {t("filters.label")}
        </Text>
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
      cities={cityOptions}
      isCitiesLoading={isCitiesLoading}
    />
  );

  if (viewMode === "map") {
    return (
      <TabPage
        refreshing={isRefreshing}
        onRefresh={refresh}
        scroll={false}
        showHeader={false}
      >
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

          <View pointerEvents="box-none" className="absolute inset-x-3 top-3">
            <View
              className="rounded-[26px] border border-border-default bg-background-primary/95 p-3"
              style={shadows.md}
            >
              <TabScreenHeader />

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("sort.accessibility")}
                onPress={toggleSort}
                className="mt-1 flex-row items-center gap-2 rounded-xl bg-surface-secondary px-3 py-2.5 active:opacity-70"
              >
                <FontAwesome6
                  name={filters.sortBy === "time" ? "clock" : "location-dot"}
                  size={13}
                  color={themeColors.brand.primary}
                />
                <Text
                  numberOfLines={1}
                  className="flex-1 font-body-bold text-body-sm text-text-primary"
                >
                  {filters.sortBy === "time"
                    ? t("sort.timeLabel")
                    : t("sort.locationLabel")}
                </Text>
                <FontAwesome6
                  name="arrows-up-down"
                  size={9}
                  color={themeColors.text.tertiary}
                />
              </Pressable>

              <View className="mt-3 flex-row items-center justify-between gap-sm border-t border-border-default pt-3">
                {viewModeToggle}
                {filterButtons}
              </View>
            </View>
          </View>
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
      <Animated.View
        entering={FadeInDown.duration(500).delay(60)}
        className="gap-md"
      >
        <View className="flex-row items-center">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("sort.accessibility")}
            onPress={toggleSort}
            className="flex-1 flex-row items-center gap-sm active:opacity-70"
          >
            <FontAwesome6
              name={filters.sortBy === "time" ? "clock" : "location-dot"}
              size={14}
              color={themeColors.brand.primary}
            />
            <Text
              numberOfLines={1}
              className="flex-shrink font-body-bold text-body text-text-primary"
            >
              {filters.sortBy === "time"
                ? t("sort.timeLabel")
                : t("sort.locationLabel")}
            </Text>
            <FontAwesome6
              name="arrows-up-down"
              size={10}
              color={themeColors.text.tertiary}
            />
          </Pressable>
        </View>

        <SegmentedTabs
          options={[
            { key: "all", label: t("scope.all") },
            { key: "friends", label: t("scope.friends") },
            ...(hasOrganizations
              ? [
                  {
                    key: "organizations",
                    label: t("scope.organizations"),
                  } as const,
                ]
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

        <View className="flex-row items-center justify-between gap-sm">
          {viewModeToggle}
          {filterButtons}
        </View>
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
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
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
  text,
  active,
  onPress,
}: {
  icon: "list" | "map-location-dot";
  label: string;
  text: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      className={`h-9 flex-row items-center justify-center gap-2 rounded-full px-3 active:opacity-80 ${
        active ? "bg-brand-primary" : ""
      }`}
    >
      <FontAwesome6
        name={icon}
        size={14}
        color={active ? themeColors.text.onPrimary : themeColors.text.secondary}
      />
      <Text
        className={`font-body-bold text-caption ${
          active ? "text-text-on-primary" : "text-text-secondary"
        }`}
      >
        {text}
      </Text>
    </Pressable>
  );
}
