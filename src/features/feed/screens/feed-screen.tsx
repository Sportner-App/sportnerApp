import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import {
  AppScreen,
  AppText as Text,
  brandRefreshControl,
  EmptyState,
  LinearRefreshBar,
  ScreenHeader,
  ScreenLoader,
  SegmentedTabs,
  UserIdentity,
} from "@/components";
import { useToast } from "@/contexts";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  getExploreFeed,
  getHomeFeed,
  likePost,
  unlikePost,
} from "@/features/feed/services/posts-service";
import type { ApiPost } from "@/features/feed/types";

type Tab = "home" | "explore";

export function FeedScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { t } = useTranslation(["feed", "social"]);
  const [tab, setTab] = useState<Tab>("home");
  const fetchPage = useCallback(
    (cursor: string | null) =>
      (tab === "home" ? getHomeFeed : getExploreFeed)(cursor ?? undefined),
    [tab],
  );

  const {
    items: posts,
    isLoading,
    isRefreshing,
    isLoadingMore,
    refresh,
    loadMore,
  } = usePaginatedList<ApiPost, string>(fetchPage, {
    onError: (error) =>
      showToast({
        type: "error",
        title: t("feed:toasts.loadFailed"),
        description: getApiErrorMessage(error),
      }),
  });

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
              <Text className="font-body text-caption text-brand-primary">
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
        onRefresh: refresh,
      })}
      onEndReached={loadMore}
    >
      <SegmentedTabs
        options={[
          { key: "home", label: t("feed:tabs.home") },
          { key: "explore", label: t("feed:tabs.explore") },
        ]}
        value={tab}
        onChange={setTab}
      />

      {isLoading ? (
        <ScreenLoader label={t("feed:loading")} />
      ) : posts.length === 0 ? (
        <EmptyState
          variant="inline"
          message={t("feed:empty")}
          className="py-10"
        />
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
            <Text className="font-body text-body-sm text-text-primary">
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
                    await refresh();
                  } catch (error) {
                    showToast({
                      type: "error",
                      title: t("social:toasts.actionFailed"),
                      description: getApiErrorMessage(error),
                    });
                  }
                }}
              >
                <Text className="font-body-bold text-caption text-brand-primary">
                  {t("social:likesCount", { count: post.likeCount })}
                </Text>
              </Pressable>
              <Text className="font-body-bold text-caption text-text-tertiary">
                {t("social:commentsCount", { count: post.commentCount })}
              </Text>
            </View>
          </Pressable>
        ))
      )}

      {isLoadingMore ? (
        <ScreenLoader label={t("feed:loading")} variant="more" />
      ) : null}
    </AppScreen>
  );
}
