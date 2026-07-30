import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EventCard, type EventFeedItem } from "@/entities/event";
import { useAuth } from "@/features/auth";
import { useEventsFeed } from "@/features/events-feed/model/use-events-feed";
import { EmptyState } from "@/features/events-feed/ui/empty-state";
import { apiClient } from "@/shared/api/client";
import { DynamicIcon } from "@/shared/ui";

function getDisplayName(email: string | null) {
  if (!email) {
    return "Sporcu";
  }

  const localPart = email.split("@")[0] ?? "Sporcu";
  const sanitized = localPart.replace(/[._-]+/g, " ").trim();

  if (!sanitized) {
    return "Sporcu";
  }

  return sanitized
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getFirstName(name: string) {
  const first = name.trim().split(" ").filter(Boolean)[0];
  return first || "Sporcu";
}

function FeedHeader() {
  const router = useRouter();
  const { userEmail, user, userId } = useAuth();
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);
  const [profileFullName, setProfileFullName] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProfilePreview() {
      if (!userId) {
        setProfileAvatarUrl(null);
        setProfileFullName(null);
        return;
      }

      try {
        const response = await apiClient.get<{
          full_name?: string;
          avatar_url?: string;
        }>(`/api/profiles/${userId}`);
        const data = response.data;

        if (!isMounted) {
          return;
        }

        setProfileAvatarUrl(
          data && typeof data.avatar_url === "string" ? data.avatar_url : null,
        );
        setProfileFullName(
          data && typeof data.full_name === "string" ? data.full_name : null,
        );
      } catch (error) {
        console.error("Profile preview loading failed:", error);
      }
    }

    void loadProfilePreview();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const fullName =
    (typeof profileFullName === "string" && profileFullName.trim()) ||
    (typeof user?.user_metadata?.full_name === "string" &&
      user.user_metadata.full_name.trim()) ||
    getDisplayName(userEmail);
  const displayName = getFirstName(fullName);
  const metadataAvatarUrl =
    typeof user?.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : null;
  const avatarUrl = profileAvatarUrl ?? metadataAvatarUrl;
  const cityLabel =
    typeof user?.user_metadata?.city === "string" &&
    user.user_metadata.city.trim().length > 0
      ? user.user_metadata.city.trim().toUpperCase()
      : "KADIKOY, ISTANBUL";

  return (
    <View className="mb-4">
      <View className="flex-row items-center px-1 py-1.5">
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            className="h-12 w-12 rounded-full border-[2px] border-brand-primary"
          />
        ) : (
          <View className="h-12 w-12 items-center justify-center rounded-full border-[2px] border-brand-primary bg-brand-raised">
            <FontAwesome6 name="user" size={18} color="#ccff00" />
          </View>
        )}

        <View className="ml-3 flex-1">
          <Text className="font-display text-[22px] leading-[26px] text-white">
            Merhaba, {displayName} 👋
          </Text>
          <Text className="font-mono text-[11px] uppercase tracking-[1px] text-brand-neutral">
            {cityLabel}
          </Text>
        </View>

        <View className="flex-row gap-2">
          <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-brand-raised">
            <FontAwesome6 name="bell" size={17} color="#cbd5e1" />
          </Pressable>
          <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-brand-raised">
            <FontAwesome6 name="gear" size={17} color="#cbd5e1" />
          </Pressable>
        </View>
      </View>

      <View className="mt-3 flex-row items-center gap-3">
        <Text className="text-white font-semibold text-2xl">
          Yeni Etkinlik Oluştur
        </Text>
        <Pressable
          onPress={() => router.push("/events/create")}
          className="flex gap-2 flex-row items-center rounded-full border border-brand-primary bg-brand-raised px-3 py-1.5"
        >
          <DynamicIcon name="plus" size={14} color="#ccff00" />
        </Pressable>
      </View>
    </View>
  );
}

function LoadingState() {
  return (
    <View className="flex-1 items-center justify-center py-20">
      <ActivityIndicator size="large" color="#ccff00" />
      <Text className="mt-4 font-body text-sm text-brand-neutral">
        Etkinlikler yukleniyor...
      </Text>
    </View>
  );
}

export function EventsFeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    filteredEvents,
    isLoading,
    isRefreshing,
    locationMessage,
    isUsingNearbySort,
    error,
    refresh,
  } = useEventsFeed();

  const listHeader = useMemo(
    () => (
      <>
        {locationMessage ? (
          <View className="mb-4 rounded-2xl border border-brand-tertiary bg-brand-surface px-3 py-2.5">
            <Text className="font-body text-xs text-brand-neutral">
              {locationMessage}
            </Text>
          </View>
        ) : null}
        {isUsingNearbySort ? (
          <View className="mb-3 self-start rounded-full bg-brand-raised px-3 py-1">
            <Text className="font-mono text-[11px] text-brand-primary">
              Konuma gore en yakinlar
            </Text>
          </View>
        ) : null}
      </>
    ),
    [isUsingNearbySort, locationMessage],
  );

  if (isLoading && filteredEvents.length === 0) {
    return (
      <View className="flex-1 bg-brand-secondary">
        <View
          className="px-4"
          style={{ paddingTop: Math.max(insets.top, 12), paddingBottom: 6 }}
        >
          <FeedHeader />
        </View>
        <View className="px-4">{listHeader}</View>
        <LoadingState />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-brand-secondary">
      <View
        className="px-4"
        style={{ paddingTop: Math.max(insets.top, 12), paddingBottom: 6 }}
      >
        <FeedHeader />
      </View>

      <FlatList<EventFeedItem>
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EventCard
            item={item}
            onPress={(pressedItem) => router.push(`/events/${pressedItem.id}`)}
          />
        )}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 32,
          paddingTop: 2,
        }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          error ? (
            <View className="mt-10 rounded-2xl border border-red-500/30 bg-red-950/30 px-4 py-4">
              <Text className="font-body text-sm text-red-400">{error}</Text>
              <Pressable
                onPress={() => void refresh()}
                className="mt-3 self-start rounded-xl bg-brand-primary px-4 py-2"
              >
                <Text className="font-display text-sm text-brand-secondary">
                  Yeniden Dene
                </Text>
              </Pressable>
            </View>
          ) : (
            <View className="mt-10">
              <EmptyState />
              <Pressable
                onPress={() => void refresh()}
                className="mt-4 self-center rounded-xl border border-brand-tertiary bg-brand-surface px-4 py-2"
              >
                <Text className="font-body text-sm text-brand-neutral">
                  Yakinlarda Etkinlik Bulunamadi - Tekrar Dene
                </Text>
              </Pressable>
            </View>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor="#ccff00"
            colors={["#ccff00"]}
          />
        }
      />
    </View>
  );
}
