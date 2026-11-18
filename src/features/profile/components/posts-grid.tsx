import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useFocusEffect, useRouter } from "expo-router";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Image, Pressable, View } from "react-native";

import { AppText as Text, EmptyState } from "@/components";
import { themeColors } from "@/constants/theme";
import { listUserPosts } from "@/features/feed/services/posts-service";
import { POST_MEDIA_TYPE, type ApiPost } from "@/features/feed/types";
import { resolveMediaUrl } from "@/utils/media-url";

const COLUMNS = 3;
const GAP = 3;

export type PostsGridRow = { key: string; posts: ApiPost[] };

/**
 * Profildeki gönderiler. Izgara sanal listede satır satır çiziliyor (her
 * satır 3 gönderi); kaydırdıkça sonraki sayfa yükleniyor.
 */
export function useUserPosts(userId: string | undefined) {
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const requestId = useRef(0);

  // Detayda silinen ya da yeni paylaşılan gönderi dönünce yansısın.
  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      const current = ++requestId.current;
      void listUserPosts(userId)
        .then((page) => {
          if (current !== requestId.current) return;
          setPosts(page.items);
          setNextCursor(page.nextCursor);
          setFailed(false);
        })
        .catch(() => {
          if (current === requestId.current) setFailed(true);
        })
        .finally(() => {
          if (current === requestId.current) setIsLoading(false);
        });
    }, [userId]),
  );

  const loadMore = useCallback(() => {
    if (!userId || !nextCursor || isLoadingMore) return;
    const current = requestId.current;
    setIsLoadingMore(true);
    void listUserPosts(userId, nextCursor)
      .then((page) => {
        if (current !== requestId.current) return;
        setPosts((previous) => [...previous, ...page.items]);
        setNextCursor(page.nextCursor);
      })
      .catch(() => undefined)
      .finally(() => setIsLoadingMore(false));
  }, [isLoadingMore, nextCursor, userId]);

  const rows = useMemo<PostsGridRow[]>(() => {
    const result: PostsGridRow[] = [];
    for (let index = 0; index < posts.length; index += COLUMNS) {
      const slice = posts.slice(index, index + COLUMNS);
      result.push({ key: slice[0].id, posts: slice });
    }
    return result;
  }, [posts]);

  return { rows, isLoading, isLoadingMore, failed, loadMore };
}

/** Bir ızgara satırı: 3 kare, eksik kalanların yeri boş. */
export const PostsGridRowView = memo(function PostsGridRowView({
  row,
  isLast,
}: {
  row: PostsGridRow;
  isLast: boolean;
}) {
  const router = useRouter();

  return (
    <View
      className="flex-row"
      style={{ gap: GAP, marginBottom: isLast ? 0 : GAP }}
    >
      {Array.from({ length: COLUMNS }, (_, index) => {
        const post = row.posts[index];
        return (
          <View key={post?.id ?? `empty-${index}`} className="flex-1">
            {post ? (
              <PostTile
                post={post}
                onPress={() => router.push(`/posts/${post.id}`)}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
});

export function PostsGridPlaceholder({
  isLoading,
  failed,
  isOwnProfile,
}: {
  isLoading: boolean;
  failed: boolean;
  isOwnProfile: boolean;
}) {
  const { t } = useTranslation("profile");
  const router = useRouter();

  if (isLoading) {
    return (
      <View className="items-center py-8">
        <ActivityIndicator color={themeColors.text.secondary} />
      </View>
    );
  }

  return (
    <EmptyState
      icon="images"
      message={
        failed
          ? t("posts.unavailable")
          : isOwnProfile
            ? t("posts.emptyOwn")
            : t("posts.empty")
      }
      action={
        isOwnProfile && !failed
          ? {
              label: t("posts.create"),
              onPress: () => router.push("/posts/create"),
            }
          : undefined
      }
    />
  );
}

export function PostsGridLoadingMore() {
  return (
    <View className="items-center py-5">
      <ActivityIndicator color={themeColors.text.secondary} />
    </View>
  );
}

function PostTile({ post, onPress }: { post: ApiPost; onPress: () => void }) {
  const { t } = useTranslation("profile");
  const cover = post.media[0];
  const isVideo = cover?.mediaType === POST_MEDIA_TYPE.video;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("posts.openAccessibility")}
      onPress={onPress}
      className="aspect-square overflow-hidden rounded-md bg-surface-secondary active:opacity-80"
    >
      {cover && !isVideo ? (
        <Image
          source={{ uri: resolveMediaUrl(cover.storagePath) }}
          resizeMode="cover"
          className="h-full w-full"
        />
      ) : cover && isVideo ? (
        <View className="h-full w-full items-center justify-center">
          <FontAwesome6
            name="play"
            size={18}
            color={themeColors.text.secondary}
          />
        </View>
      ) : (
        <View className="h-full w-full items-center justify-center p-2">
          <FontAwesome6
            name="quote-left"
            size={14}
            color={themeColors.text.tertiary}
          />
          <Text
            numberOfLines={3}
            className="mt-1 text-center text-caption text-text-secondary"
          >
            {post.content}
          </Text>
        </View>
      )}

      {post.mediaCount > 1 ? (
        <View className="absolute right-1.5 top-1.5">
          <FontAwesome6
            name="clone"
            size={12}
            color={themeColors.text.primary}
          />
        </View>
      ) : null}
    </Pressable>
  );
}
