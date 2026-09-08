import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import {
  AppScreen,
  brandRefreshControl,
  LinearRefreshBar,
  ScreenHeader,
  SegmentedTabs,
  SportLoader,
  UserIdentity,
} from "@/components";
import { useToast } from "@/contexts";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  getExploreFeed,
  getHomeFeed,
  likePost,
  unlikePost,
} from "@/services/social-service";
import type { ApiPost } from "@/types/social";

type Tab = "home" | "explore";

export function FeedScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { t } = useTranslation(["feed", "social"]);
  const [tab, setTab] = useState<Tab>("home");
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const load = useCallback(
    async (mode: "initial" | "refresh" | "more", nextTab = tab) => {
      if (mode === "initial") setIsLoading(true);
      if (mode === "refresh") setIsRefreshing(true);
      if (mode === "more") setIsLoadingMore(true);
      try {
        const fetch = nextTab === "home" ? getHomeFeed : getExploreFeed;
        const page = await fetch(
          mode === "more" ? (cursor ?? undefined) : undefined,
        );
        setPosts((prev) =>
          mode === "more" ? [...prev, ...page.items] : page.items,
        );
        setCursor(page.nextCursor);
      } catch (error) {
        showToast({
          type: "error",
          title: t("feed:toasts.loadFailed"),
          description: getApiErrorMessage(error),
        });
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [cursor, showToast, t, tab],
  );

  useEffect(() => {
    void load("initial");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const loadMore = useCallback(() => {
    if (!cursor || isLoading || isRefreshing || isLoadingMore) {
      return;
    }
    void load("more");
  }, [cursor, isLoading, isLoadingMore, isRefreshing, load]);

  return (
    <AppScreen
      header={
        <ScreenHeader
          title={t("feed:header.title")}
          showBack
          right={
            <Pressable
              onPress={() => router.push("/posts/create")}
              className="px-1"
            >
              <Text className="font-body text-xs text-brand-primary">
                {t("feed:header.write")}
              </Text>
            </Pressable>
          }
        />
      }
      belowHeader={<LinearRefreshBar visible={isRefreshing} />}
      contentClassName="gap-3 px-6 pt-3"
      refreshControl={brandRefreshControl({
        refreshing: isRefreshing,
        onRefresh: () => load("refresh"),
      })}
      onEndReached={loadMore}
    >
      <SegmentedTabs
        options={[
          { key: "home", label: t("feed:tabs.home") },
          { key: "explore", label: t("feed:tabs.explore") },
        ]}
        value={tab}
        onChange={(next) => {
          setTab(next);
          setCursor(null);
        }}
      />

      {isLoading ? (
        <View className="items-center py-16">
          <SportLoader size={120} label={t("feed:loading")} />
        </View>
      ) : posts.length === 0 ? (
        <Text className="py-10 text-center font-body text-sm text-brand-neutral">
          {t("feed:empty")}
        </Text>
      ) : (
        posts.map((post) => (
          <Pressable
            key={post.id}
            onPress={() => router.push(`/posts/${post.id}`)}
            className="gap-2 rounded-3xl border border-border-default bg-surface-primary p-4"
          >
            <UserIdentity
              username={post.username}
              avatarUrl={post.profileImageUrl}
              fallbackName={post.firstName}
              avatarSize={38}
              onPress={() => router.push(`/users/${post.userId}`)}
            />
            <Text className="font-body text-sm text-text-primary">
              {post.content || t("social:fallback.post")}
            </Text>
            <View className="flex-row gap-4">
              <Pressable
                onPress={async () => {
                  try {
                    if (post.likedByMe) {
                      await unlikePost(post.id);
                    } else {
                      await likePost(post.id);
                    }
                    await load("refresh");
                  } catch (error) {
                    showToast({
                      type: "error",
                      title: t("social:toasts.actionFailed"),
                      description: getApiErrorMessage(error),
                    });
                  }
                }}
              >
                <Text className="font-mono text-xs text-brand-primary">
                  {t("social:likesCount", { count: post.likeCount })}
                </Text>
              </Pressable>
              <Text className="font-mono text-xs text-brand-neutral">
                {t("social:commentsCount", { count: post.commentCount })}
              </Text>
            </View>
          </Pressable>
        ))
      )}

      {isLoadingMore ? (
        <View className="items-center py-5">
          <SportLoader size={64} label={t("feed:loading")} />
        </View>
      ) : null}
    </AppScreen>
  );
}
