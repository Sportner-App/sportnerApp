import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import {
  AppScreen,
  BrandRefreshControl,
  Button,
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
  const [tab, setTab] = useState<Tab>("home");
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(
    async (mode: "initial" | "refresh" | "more", nextTab = tab) => {
      if (mode === "initial") setIsLoading(true);
      if (mode === "refresh") setIsRefreshing(true);
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
          title: "Akış yüklenemedi",
          description: getApiErrorMessage(error),
        });
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [cursor, showToast, tab],
  );

  useEffect(() => {
    void load("initial");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <AppScreen
      header={
        <ScreenHeader
          title="AKIŞ"
          showBack
          right={
            <Pressable
              onPress={() => router.push("/posts/create")}
              className="px-1"
            >
              <Text className="font-body text-xs text-brand-primary">Yaz</Text>
            </Pressable>
          }
        />
      }
      belowHeader={<LinearRefreshBar visible={isRefreshing} />}
      contentClassName="gap-3 px-6 pt-3"
      refreshControl={
        <BrandRefreshControl
          refreshing={isRefreshing}
          onRefresh={() => load("refresh")}
        />
      }
    >
      <SegmentedTabs
        options={[
          { key: "home", label: "Takip" },
          { key: "explore", label: "Keşfet" },
        ]}
        value={tab}
        onChange={(next) => {
          setTab(next);
          setCursor(null);
        }}
      />

      {isLoading ? (
        <View className="items-center py-16">
          <SportLoader size={120} label="Akış yükleniyor" />
        </View>
      ) : posts.length === 0 ? (
        <Text className="py-10 text-center font-body text-sm text-brand-neutral">
          Henüz gönderi yok.
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
              {post.content || "Gönderi"}
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
                      title: "İşlem başarısız",
                      description: getApiErrorMessage(error),
                    });
                  }
                }}
              >
                <Text className="font-mono text-xs text-brand-primary">
                  {post.likeCount} beğeni
                </Text>
              </Pressable>
              <Text className="font-mono text-xs text-brand-neutral">
                {post.commentCount} yorum
              </Text>
            </View>
          </Pressable>
        ))
      )}

      {cursor ? (
        <Button
          label="Daha fazla"
          variant="outline"
          size="sm"
          onPress={() => load("more")}
        />
      ) : null}
    </AppScreen>
  );
}
