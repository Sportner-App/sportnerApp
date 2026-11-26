import { useCallback, useRef, useState } from "react";

import i18n from "@/i18n";
import {
  useRefreshableLoad,
  type LoadMode,
} from "@/hooks/use-refreshable-load";
import { getApiErrorMessage, isApiError } from "@/lib/api/errors";
import {
  explorePeople,
  listFriends,
} from "@/features/social/services/social-service";
import {
  createComment,
  createReply,
  explorePosts,
  likePost,
  unlikePost,
} from "@/features/feed/services/posts-service";
import type { ApiComment, ApiPost } from "@/features/feed/types";
import type { ExplorePerson } from "@/features/social/types";

/**
 * Gönderi yükü arkadaşlık durumu taşımıyor; kart başına istek atmamak için
 * arkadaş id'lerini bir kez toplayıp kartlarda küme üzerinden bakıyoruz.
 */
const FRIEND_PAGE_SIZE = 100;
const FRIEND_MAX_PAGES = 5;

async function fetchFriendIds(): Promise<Set<string>> {
  const ids = new Set<string>();

  for (let page = 1; page <= FRIEND_MAX_PAGES; page += 1) {
    const result = await listFriends(page, FRIEND_PAGE_SIZE);
    result.items.forEach((friend) => ids.add(friend.userId));
    if (!result.hasNext) {
      break;
    }
  }

  return ids;
}

export type DiscoverScope = "all" | "friends";

const PAGE_SIZE = 12;
/**
 * Odak tazelemesinin en çok isteyeceği gönderi. API 50'ye izin veriyor ama
 * gönderi başına birkaç sorgu atıyor; fazlası korunur, yeniden istenmez.
 */
const MAX_SILENT_LIMIT = 36;
const INVALID_CURSOR_CODE = "Post.InvalidCursor";

type LoadOptions = {
  /** Yüklü listeyi koruyan birleştirme yapılmaz; ilk sayfa düz değiştirir. */
  noMerge?: boolean;
};

export function useDiscover() {
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [people, setPeople] = useState<ExplorePerson[]>([]);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  /** Bu oturumda istek gönderilenler: kart geri dönüşümünde durum kaybolmasın. */
  const [requestedFriendIds, setRequestedFriendIds] = useState<Set<string>>(
    new Set(),
  );
  const [scope, setScope] = useState<DiscoverScope>("all");
  // Kapsam değişiminde eski kapsamla tazeleme yapılmasın diye ref'te tutuyoruz.
  const scopeRef = useRef<DiscoverScope>("all");
  scopeRef.current = scope;
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  /** Son "daha fazla" sayfası hata verdi; liste ve hasMore olduğu gibi kalır. */
  const [loadMoreFailed, setLoadMoreFailed] = useState(false);

  // Odak tazelemesi ve "daha fazla" yüklü listeyi buradan okur; callback'ler
  // sabit kalsın diye state'e bağlanmaz.
  const postsRef = useRef<ApiPost[]>(posts);
  postsRef.current = posts;
  // Geç gelen eski yanıt yeni listeyi ezmesin; her load ve loadMore artırır.
  const requestIdRef = useRef(0);
  // "initial" (kapsam değişimi) bekliyorken liste güvenilmez: hata gelirse
  // eski kapsamın gönderileri ekranda kalmasın.
  const pendingResetRef = useRef(false);
  const loadInFlightRef = useRef(false);
  const moreInFlightRef = useRef(false);
  const latestLoadRef = useRef<Promise<void> | null>(null);

  const load = useCallback(
    (mode: LoadMode, options?: LoadOptions): Promise<void> => {
      const requestId = ++requestIdRef.current;
      const isLatest = () => requestId === requestIdRef.current;
      loadInFlightRef.current = true;
      // load, süren "more" isteğini geçersiz kılar.
      moreInFlightRef.current = false;
      setIsLoadingMore(false);
      if (mode === "initial") {
        pendingResetRef.current = true;
        setError(null);
      }
      if (mode !== "silent") {
        setLoadMoreFailed(false);
      }

      let own: Promise<void> | null = null;
      const run = async () => {
        const friendsOnly = scopeRef.current === "friends";
        const resetPending = pendingResetRef.current;
        const loadedCount = postsRef.current.length;
        const adaptive =
          mode === "silent" && !resetPending && !options?.noMerge;
        const limit = adaptive
          ? Math.min(MAX_SILENT_LIMIT, Math.max(PAGE_SIZE, loadedCount))
          : PAGE_SIZE;
        const mergeTail = adaptive && loadedCount > MAX_SILENT_LIMIT;

        try {
          const [postResult, peopleResult, friendResult] =
            await Promise.allSettled([
              explorePosts({ limit, friendsOnly }),
              explorePeople({ limit: 12 }),
              fetchFriendIds(),
            ]);

          if (!isLatest()) {
            // Yerini yenisine bırakan istek, göstergeleri yenisi bitene kadar açık tutar.
            const latest = latestLoadRef.current;
            if (latest && latest !== own) await latest;
            return;
          }
          if (postResult.status === "rejected") throw postResult.reason;

          const fresh = postResult.value;
          pendingResetRef.current = false;
          setError(null);

          // Yüklü liste bu sınırdan uzunsa taze sayfa yalnızca başı yeniler; kuyruk
          // taze listenin son öğesinin eski yerinden sonra korunur.
          const lastFreshId = fresh[fresh.length - 1]?.id;
          const keepTail =
            mergeTail &&
            lastFreshId !== undefined &&
            postsRef.current.some((post) => post.id === lastFreshId);

          setPosts((prev) => {
            if (!keepTail) return [...fresh];
            const tailIndex = prev.findIndex((post) => post.id === lastFreshId);
            if (tailIndex < 0) return [...fresh];
            const known = new Set(fresh.map((post) => post.id));
            return [
              ...fresh,
              ...prev.slice(tailIndex + 1).filter((post) => !known.has(post.id)),
            ];
          });
          if (!keepTail) {
            setHasMore(fresh.length === limit);
          }
          if (mode === "silent") {
            setLoadMoreFailed(false);
          }

          if (peopleResult.status === "fulfilled") {
            setPeople(peopleResult.value);
          }
          // Giriş yapılmamışsa istek 401 döner; kartlar arkadaş ekleme göstermez.
          if (friendResult.status === "fulfilled") {
            setFriendIds(friendResult.value);
          }
        } catch (err) {
          if (!isLatest()) return;
          setError(getApiErrorMessage(err, i18n.t("discover:loadFailed")));
          if (pendingResetRef.current) {
            pendingResetRef.current = false;
            setPosts([]);
            setHasMore(false);
          } else {
            // Tazeleme sürerken yok sayılan "liste sonu" yeniden denetlensin.
            setPosts((prev) => [...prev]);
          }
        } finally {
          if (isLatest()) {
            loadInFlightRef.current = false;
          }
        }
      };

      own = run();
      latestLoadRef.current = own;
      return own;
    },
    [],
  );

  const { isLoading, isRefreshing, refresh, reload } = useRefreshableLoad(
    load,
    { trigger: "focus", refocusMode: "silent" },
  );

  const fetchMore = useCallback(async () => {
    const current = postsRef.current;
    const before = current[current.length - 1]?.id;
    if (!before) return;

    const requestId = ++requestIdRef.current;
    const isLatest = () => requestId === requestIdRef.current;
    moreInFlightRef.current = true;
    setIsLoadingMore(true);
    setLoadMoreFailed(false);

    try {
      const result = await explorePosts({
        limit: PAGE_SIZE,
        friendsOnly: scopeRef.current === "friends",
        before,
      });
      if (!isLatest()) return;

      const known = new Set(postsRef.current.map((post) => post.id));
      const added = result.filter((post) => !known.has(post.id));
      if (added.length === 0) {
        // Eski sunucu `before`'u yok sayıp ilk sayfayı döner: sonsuz istek olmasın.
        setHasMore(false);
      } else {
        setPosts((prev) => {
          const seen = new Set(prev.map((post) => post.id));
          return [...prev, ...added.filter((post) => !seen.has(post.id))];
        });
        setHasMore(result.length === PAGE_SIZE);
      }
    } catch (err) {
      if (!isLatest()) return;
      if (isApiError(err) && err.code === INVALID_CURSOR_CODE) {
        // İmleç gönderisi silinmiş: listeyi ilk sayfadan, göstergesiz yenile.
        void load("silent", { noMerge: true });
      } else {
        setLoadMoreFailed(true);
      }
    } finally {
      if (isLatest()) {
        moreInFlightRef.current = false;
        setIsLoadingMore(false);
      }
    }
  }, [load]);

  const loadMore = useCallback(() => {
    if (
      !hasMore ||
      isLoadingMore ||
      isLoading ||
      isRefreshing ||
      loadMoreFailed ||
      loadInFlightRef.current ||
      moreInFlightRef.current
    ) {
      return;
    }
    void fetchMore();
  }, [fetchMore, hasMore, isLoadingMore, isLoading, isRefreshing, loadMoreFailed]);

  // Footer'daki dokunma/otomatik deneme: hata bayrağını yok sayar.
  const retryLoadMore = useCallback(() => {
    if (
      !hasMore ||
      isLoadingMore ||
      isLoading ||
      isRefreshing ||
      loadInFlightRef.current ||
      moreInFlightRef.current
    ) {
      return;
    }
    void fetchMore();
  }, [fetchMore, hasMore, isLoadingMore, isLoading, isRefreshing]);

  const reloadFeed = useCallback(() => {
    void reload("initial");
  }, [reload]);

  const changeScope = useCallback(
    (next: DiscoverScope) => {
      if (next === scopeRef.current) {
        return;
      }
      scopeRef.current = next;
      setScope(next);
      setLoadMoreFailed(false);
      void reload("initial");
    },
    [reload],
  );

  const markFriendRequested = useCallback((userId: string) => {
    setRequestedFriendIds((current) => new Set(current).add(userId));
  }, []);

  const patchPost = useCallback((postId: string, next: Partial<ApiPost>) => {
    setPosts((current) =>
      current.map((post) => (post.id === postId ? { ...post, ...next } : post)),
    );
  }, []);

  const toggleLike = useCallback(
    async (post: ApiPost) => {
      const liked = post.likedByMe;
      patchPost(post.id, {
        likedByMe: !liked,
        likeCount: Math.max(post.likeCount + (liked ? -1 : 1), 0),
      });

      try {
        if (liked) {
          await unlikePost(post.id);
        } else {
          await likePost(post.id);
        }
      } catch (err) {
        patchPost(post.id, {
          likedByMe: liked,
          likeCount: post.likeCount,
        });
        throw err;
      }
    },
    [patchPost],
  );

  const addComment = useCallback(
    async (
      post: ApiPost,
      content: string,
      mentionedUserIds: string[] = [],
    ): Promise<ApiComment> => {
      const comment = await createComment(post.id, content, mentionedUserIds);
      if (!comment) {
        throw new Error(i18n.t("social:toasts.commentFailed"));
      }
      patchPost(post.id, { commentCount: post.commentCount + 1 });
      return comment;
    },
    [patchPost],
  );

  const addReply = useCallback(
    async (
      post: ApiPost,
      parentCommentId: string,
      content: string,
      mentionedUserIds: string[] = [],
    ): Promise<ApiComment> => {
      const reply = await createReply(
        post.id,
        parentCommentId,
        content,
        mentionedUserIds,
      );
      if (!reply) {
        throw new Error(i18n.t("social:toasts.replyFailed"));
      }
      patchPost(post.id, { commentCount: post.commentCount + 1 });
      return reply;
    },
    [patchPost],
  );

  return {
    posts,
    people,
    friendIds,
    requestedFriendIds,
    markFriendRequested,
    scope,
    setScope: changeScope,
    isLoading,
    isRefreshing,
    isLoadingMore,
    loadMoreFailed,
    hasMore,
    error,
    refresh,
    reload: reloadFeed,
    loadMore,
    retryLoadMore,
    toggleLike,
    addComment,
    addReply,
  };
}
