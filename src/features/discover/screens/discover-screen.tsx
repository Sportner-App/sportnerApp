import type { ListRenderItem } from "@shopify/flash-list";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import {
  EmptyState,
  ErrorState,
  Input,
  LoadMoreFooter,
  ScreenLoader,
  SegmentedTabs,
} from "@/components";
import { TabListPage } from "@/features/app-shell/components/tab-list-page";
import { useDiscover } from "@/features/discover/hooks/use-discover";
import { useRequireAuth } from "@/features/auth/hooks/use-require-auth";

import { DiscoverModeTabs } from "@/features/discover/components/discover-mode-tabs";
import { DiscoverPost } from "@/features/discover/components/discover-post";
import { PeopleRail } from "@/features/discover/components/people-rail";
import { PostSkeleton } from "@/features/discover/components/post-skeleton";
import { CommentsSheet } from "@/features/feed/components/comments-sheet";
import type { ApiComment, ApiPost } from "@/features/feed/types";
import { ClubExploreEmpty } from "@/features/organizations/components/club-explore-empty";
import { ClubExploreRow } from "@/features/organizations/components/club-explore-row";
import { MyOrganizationsList } from "@/features/organizations/components/my-organizations-list";
import { useExploreClubs } from "@/features/organizations/hooks/use-explore-clubs";
import { useMyOrganizations } from "@/features/organizations/hooks/use-organizations";
import type { ApiOrganizationSummary } from "@/features/organizations/types";

type DiscoverMode = "feed" | "clubs";
type ClubScope = "all" | "mine";

type DiscoverRow =
  | {
      type: "post";
      key: string;
      post: ApiPost;
      isFriend: boolean;
      friendRequestSent: boolean;
    }
  | { type: "clubs"; key: string; clubs: ApiOrganizationSummary[] };

const CLUBS_PER_ROW = 2;

const keyExtractor = (row: DiscoverRow) => row.key;
const getItemType = (row: DiscoverRow) => row.type;

export function DiscoverScreen() {
  const router = useRouter();
  const {
    mode: modeParam,
    scope: scopeParam,
    ts: tsParam,
  } = useLocalSearchParams<{
    mode?: string;
    scope?: string;
    /** Her yönlendirmede değişir; aynı mode/scope ile tekrar gelişte de senkron tetiklensin. */
    ts?: string;
  }>();
  const { isAuthenticated, requireAuth } = useRequireAuth();
  const { t } = useTranslation([
    "discover",
    "common",
    "events",
    "organizations",
  ]);
  const {
    posts,
    people,
    friendIds,
    requestedFriendIds,
    markFriendRequested,
    scope,
    setScope,
    isLoading,
    isRefreshing,
    isLoadingMore,
    loadMoreFailed,
    error,
    refresh,
    reload,
    loadMore,
    retryLoadMore,
    toggleLike,
    addComment,
    addReply,
  } = useDiscover();
  const [mode, setMode] = useState<DiscoverMode>(
    modeParam === "clubs" ? "clubs" : "feed",
  );
  const [clubScope, setClubScope] = useState<ClubScope>(
    scopeParam === "mine" ? "mine" : "all",
  );
  const explore = useExploreClubs();
  const mine = useMyOrganizations(
    isAuthenticated && mode === "clubs" && clubScope === "mine",
  );

  // Profilden / kulüpten ayrılınca tekrar gelindiğinde doğru sekme açılsın.
  useEffect(() => {
    if (modeParam === "clubs") {
      setMode("clubs");
      setClubScope(scopeParam === "mine" ? "mine" : "all");
    } else if (modeParam === "feed") {
      setMode("feed");
    }
  }, [modeParam, scopeParam, tsParam]);

  const isClubs = mode === "clubs";
  const isMine = isClubs && clubScope === "mine";
  const active = !isClubs ? null : isMine ? mine : explore;

  // Yorumlar tek bir sheet'te: son açılan gönderi id ile tutulur, güncel
  // sayaç için listeden bulunur. Tazelemede listeden düşerse son bilinen
  // gönderi kullanılır ki sheet kapanırken çökmesin.
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const openAfterMountRef = useRef(false);
  const lastCommentsPostRef = useRef<ApiPost | null>(null);
  const listedCommentsPost = commentsPostId
    ? (posts.find((post) => post.id === commentsPostId) ?? null)
    : null;
  if (listedCommentsPost) {
    lastCommentsPostRef.current = listedCommentsPost;
  }
  const commentsPost =
    listedCommentsPost ??
    (lastCommentsPostRef.current?.id === commentsPostId
      ? lastCommentsPostRef.current
      : null);

  // BottomSheet mount anında visible=true ile animasyonsuz tam açık başlıyor:
  // yeni gönderi için sheet önce kapalı mount edilir, sonra açılır.
  useEffect(() => {
    if (openAfterMountRef.current) {
      openAfterMountRef.current = false;
      setCommentsOpen(true);
    }
  }, [commentsPostId]);

  // Kartlara giden handler'ın kimliği sabit kalsın diye id ref'ten okunur.
  const commentsPostIdRef = useRef(commentsPostId);
  commentsPostIdRef.current = commentsPostId;
  const openComments = useCallback((post: ApiPost) => {
    if (post.id === commentsPostIdRef.current) {
      setCommentsOpen(true);
      return;
    }
    openAfterMountRef.current = true;
    setCommentsOpen(false);
    setCommentsPostId(post.id);
  }, []);
  const closeComments = useCallback(() => setCommentsOpen(false), []);

  const handleLike = useCallback(
    async (post: ApiPost) => {
      if (!requireAuth(t("discover:auth.like"))) return;
      await toggleLike(post);
    },
    [requireAuth, t, toggleLike],
  );
  const handleAuthorPress = useCallback(
    (post: ApiPost) => router.push(`/users/${post.userId}`),
    [router],
  );

  const handleComment = useCallback(
    (content: string, mentionedUserIds: string[]) => {
      if (!commentsPost || !requireAuth(t("discover:auth.comment"))) {
        return Promise.reject(new Error("AUTH_REQUIRED"));
      }
      return addComment(commentsPost, content, mentionedUserIds);
    },
    [addComment, commentsPost, requireAuth, t],
  );
  const handleReply = useCallback(
    (parent: ApiComment, content: string, mentionedUserIds: string[]) => {
      if (!commentsPost || !requireAuth(t("discover:auth.reply"))) {
        return Promise.reject(new Error("AUTH_REQUIRED"));
      }
      return addReply(commentsPost, parent.id, content, mentionedUserIds);
    },
    [addReply, commentsPost, requireAuth, t],
  );

  const handleScopeChange = useCallback(
    (next: "all" | "friends") => {
      if (next === "friends" && !requireAuth(t("discover:auth.friendsFilter"))) {
        return false;
      }
      setScope(next);
    },
    [requireAuth, setScope, t],
  );

  const suggestedPeople = useMemo(
    // Arkadaş olunanlar öneride durmasın: zaten eklenmiş birine
    // "Ekle" göstermek listeyi gürültüye çeviriyordu.
    () => people.filter((person) => !friendIds.has(person.userId)),
    [people, friendIds],
  );

  const exploreItems = explore.items;
  const data = useMemo<DiscoverRow[]>(() => {
    if (!isClubs) {
      if (isLoading) return [];
      return posts.map((post) => ({
        type: "post",
        key: `post-${post.id}`,
        post,
        isFriend: friendIds.has(post.userId),
        friendRequestSent: requestedFriendIds.has(post.userId),
      }));
    }
    if (isMine) return [];
    const rows: DiscoverRow[] = [];
    for (let index = 0; index < exploreItems.length; index += CLUBS_PER_ROW) {
      const clubs = exploreItems.slice(index, index + CLUBS_PER_ROW);
      rows.push({ type: "clubs", key: `clubs-${clubs[0].id}`, clubs });
    }
    return rows;
  }, [
    isClubs,
    isMine,
    isLoading,
    posts,
    friendIds,
    requestedFriendIds,
    exploreItems,
  ]);

  const renderItem = useCallback<ListRenderItem<DiscoverRow>>(
    ({ item }) =>
      item.type === "post" ? (
        // key: FlashList kartı geri dönüştürüyor; karusel sayfası, kaydırma
        // konumu ve dokunma durumu başka gönderiye taşınmasın.
        <DiscoverPost
          key={item.post.id}
          post={item.post}
          isFriend={item.isFriend}
          friendRequestSent={item.friendRequestSent}
          onLike={handleLike}
          onOpenComments={openComments}
          onAuthorPress={handleAuthorPress}
          onFriendRequested={markFriendRequested}
        />
      ) : (
        <ClubExploreRow clubs={item.clubs} />
      ),
    [handleLike, openComments, handleAuthorPress, markFriendRequested],
  );

  const header = (
    <>
      <DiscoverModeTabs
        options={[
          { key: "feed" as const, label: t("discover:mode.feed") },
          { key: "clubs" as const, label: t("discover:mode.clubs") },
        ]}
        value={mode}
        onChange={setMode}
      />

      {isClubs ? (
        <View key="clubs-controls" className="gap-4 px-5">
          <SegmentedTabs
            options={[
              { key: "all", label: t("organizations:clubs.tabAll") },
              { key: "mine", label: t("organizations:clubs.tabMine") },
            ]}
            value={clubScope}
            onChange={setClubScope}
          />
          {isMine ? (
            <MyOrganizationsList state={mine} />
          ) : (
            <Input
              icon="magnifying-glass"
              size="sm"
              value={explore.query}
              onChangeText={explore.setQuery}
              placeholder={t("organizations:explore.searchPlaceholder")}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
          )}
        </View>
      ) : (
        <>
          <View key="feed-scope" className="px-5">
            <SegmentedTabs
              options={[
                { key: "all", label: t("discover:filter.all") },
                { key: "friends", label: t("discover:filter.friends") },
              ]}
              value={scope}
              onChange={handleScopeChange}
            />
          </View>

          {suggestedPeople.length > 0 ? (
            <PeopleRail
              people={suggestedPeople}
              onOpenProfile={(userId: string) =>
                router.push(`/users/${userId}`)
              }
              onSeeAll={() => router.push("/people")}
            />
          ) : null}
        </>
      )}
    </>
  );

  const createPost = () => {
    if (requireAuth(t("discover:auth.createPost"))) {
      router.push("/posts/create");
    }
  };

  const empty = !isClubs ? (
    isLoading ? (
      <ScreenLoader
        label={t("discover:loading")}
        className="items-center px-5 py-16"
        size={148}
      />
    ) : error && posts.length === 0 ? (
      <ErrorState message={error} onRetry={reload} className="mx-5" />
    ) : (
      <EmptyState
        icon="images"
        message={t("discover:empty.message")}
        className="mx-5"
        action={{
          label: t("discover:empty.cta"),
          variant: "primary",
          onPress: createPost,
        }}
      />
    )
  ) : isMine ? null : (
    <ClubExploreEmpty state={explore} />
  );

  const footer = !isClubs ? (
    <LoadMoreFooter
      key="feed"
      isLoading={isLoadingMore}
      failed={loadMoreFailed}
      onRetry={retryLoadMore}
    >
      <PostSkeleton />
    </LoadMoreFooter>
  ) : isMine ? null : (
    <LoadMoreFooter
      key="clubs"
      isLoading={explore.isLoadingMore}
      failed={explore.loadMoreFailed}
      onRetry={explore.retryLoadMore}
    />
  );

  return (
    <TabListPage
      edgeToEdge
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemType={getItemType}
      itemGap={isClubs ? 12 : 24}
      listTopGap={isClubs ? 16 : undefined}
      refreshing={active ? active.isRefreshing : isRefreshing}
      onRefresh={
        !isClubs
          ? refresh
          : isMine && !isAuthenticated
            ? () => {}
            : (active as NonNullable<typeof active>).refresh
      }
      onEndReached={
        !isClubs ? loadMore : isMine ? undefined : explore.loadMore
      }
      header={header}
      empty={empty}
      footer={footer}
      headerAction={
        isClubs
          ? {
              icon: "plus",
              label: t("organizations:explore.createCta"),
              onPress: () =>
                requireAuth(t("organizations:explore.createAuthReason")) &&
                router.push("/clubs/create"),
            }
          : {
              icon: "plus",
              label: t("discover:hero.createA11y"),
              onPress: createPost,
            }
      }
    >
      {commentsPost ? (
        <CommentsSheet
          key={commentsPost.id}
          visible={commentsOpen}
          onClose={closeComments}
          post={commentsPost}
          onComment={handleComment}
          onReply={handleReply}
        />
      ) : null}
    </TabListPage>
  );
}
