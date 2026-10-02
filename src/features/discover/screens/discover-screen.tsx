import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
// Dikey scroller gesture-handler tabanlı; yatay şerit de aynı yerden gelmeli,
// yoksa kaydırma jesti arbitrasyonda kayboluyor.
import { ScrollView } from "react-native-gesture-handler";

import {
  AppText as Text,
  Avatar,
  EmptyState,
  ErrorState,
  ScreenLoader,
} from "@/components";
import { TabPage } from "@/features/app-shell/components/tab-page";
import { useDiscover } from "@/features/discover/hooks/use-discover";
import { useRequireAuth } from "@/features/auth/hooks/use-require-auth";

import { DiscoverPost } from "@/features/discover/components/discover-post";

export function DiscoverScreen() {
  const router = useRouter();
  const { requireAuth } = useRequireAuth();
  const { t } = useTranslation(["discover", "common", "events"]);
  const {
    posts,
    people,
    friendIds,
    scope,
    setScope,
    isLoading,
    isRefreshing,
    error,
    refresh,
    toggleLike,
    addComment,
    addReply,
  } = useDiscover();

  return (
    <TabPage
      edgeToEdge
      keyboardAvoiding
      refreshing={isRefreshing}
      onRefresh={refresh}
      headerAction={{
        icon: "plus",
        label: t("discover:hero.createA11y"),
        onPress: () =>
          requireAuth(t("discover:auth.createPost")) &&
          router.push("/posts/create"),
      }}
    >
      {/* Minimal filtre: kenarlık/dolgu yok, yalnızca aktif olan öne çıkıyor. */}
      <View className="flex-row gap-5 px-5">
        {(["all", "friends"] as const).map((option) => {
          const active = scope === option;
          return (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              hitSlop={8}
              onPress={() => {
                if (
                  option === "friends" &&
                  !requireAuth(t("discover:auth.friendsFilter"))
                ) {
                  return;
                }
                setScope(option);
              }}
              className="active:opacity-70"
            >
              <Text
                className={`font-body-bold text-body-sm ${
                  active ? "text-text-primary" : "text-text-tertiary"
                }`}
              >
                {t(`discover:filter.${option}`)}
              </Text>
              <View
                className={`mt-1.5 h-0.5 rounded-full ${
                  active ? "bg-brand-primary" : "bg-transparent"
                }`}
              />
            </Pressable>
          );
        })}
      </View>

      {people.length > 0 ? (
        <View className="gap-2.5 border-t border-b border-border-default py-1.5">
          <View className="flex-row items-center justify-between px-5">
            <Text className="font-body-bold text-overline text-text-tertiary">
              {t("discover:people.title")}
            </Text>
            <Pressable hitSlop={8} onPress={() => router.push("/people")}>
              <Text className="font-body-bold text-overline text-brand-primary">
                {t("discover:people.seeAll")}
              </Text>
            </Pressable>
          </View>
          {/* Kullanıcı adları yok: dar alanda "@test…" diye kırpılıyordu. */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
          >
            {people.map((person) => (
              <Pressable
                key={person.userId}
                accessibilityRole="button"
                accessibilityLabel={`@${person.username ?? ""}`}
                onPress={() => router.push(`/users/${person.userId}`)}
                className="active:opacity-75"
              >
                <Avatar
                  uri={person.avatarUrl}
                  name={person.name}
                  size={42}
                  borderWidth={1.5}
                />
              </Pressable>
            ))}
          </ScrollView>

          {/* <View className="mt-1 h-px bg-border-default " /> */}
        </View>
      ) : null}

      {isLoading ? (
        <ScreenLoader
          label={t("discover:loading")}
          className="items-center px-5 py-16"
          size={148}
        />
      ) : error ? (
        <ErrorState message={error} onRetry={refresh} className="mx-5" />
      ) : posts.length === 0 ? (
        <EmptyState
          icon="images"
          message={t("discover:empty.message")}
          className="mx-5"
          action={{
            label: t("discover:empty.cta"),
            variant: "primary",
            onPress: () => {
              if (requireAuth(t("discover:auth.createPost"))) {
                router.push("/posts/create");
              }
            },
          }}
        />
      ) : (
        posts.map((post) => (
          <DiscoverPost
            key={post.id}
            post={post}
            onLike={async () => {
              if (!requireAuth(t("discover:auth.like"))) return;
              await toggleLike(post);
            }}
            onComment={(content) => {
              if (!requireAuth(t("discover:auth.comment")))
                return Promise.reject(new Error("AUTH_REQUIRED"));
              return addComment(post, content);
            }}
            onReply={(parent, content) => {
              if (!requireAuth(t("discover:auth.reply")))
                return Promise.reject(new Error("AUTH_REQUIRED"));
              return addReply(post, parent.id, content);
            }}
            onAuthorPress={() => router.push(`/users/${post.userId}`)}
            isFriend={friendIds.has(post.userId)}
          />
        ))
      )}
    </TabPage>
  );
}
