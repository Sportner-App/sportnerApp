import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useRef, useState } from "react";

import i18n from "@/i18n";
import { getApiErrorMessage } from "@/lib/api/errors";
import { explorePeople } from "@/services/events-service";
import {
  createComment,
  createReply,
  explorePosts,
  likePost,
  listFriends,
  unlikePost,
} from "@/services/social-service";
import type { ApiComment, ApiPost } from "@/types/social";
import type { ExplorePerson } from "@/types/events";

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

export function useDiscover() {
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [people, setPeople] = useState<ExplorePerson[]>([]);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [scope, setScope] = useState<DiscoverScope>("all");
  // Kapsam değişiminde eski kapsamla tazeleme yapılmasın diye ref'te tutuyoruz.
  const scopeRef = useRef<DiscoverScope>("all");
  scopeRef.current = scope;
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (mode: "initial" | "refresh" | "silent") => {
    if (mode === "initial") {
      setIsLoading(true);
    } else if (mode === "refresh") {
      setIsRefreshing(true);
    }

    try {
      setError(null);
      const [postResult, peopleResult, friendResult] =
        await Promise.allSettled([
          explorePosts(36, scopeRef.current === "friends"),
          explorePeople({ limit: 12 }),
          fetchFriendIds(),
        ]);

      if (postResult.status === "rejected") throw postResult.reason;
      setPosts(postResult.value);
      if (peopleResult.status === "fulfilled") {
        setPeople(peopleResult.value);
      }
      // Giriş yapılmamışsa istek 401 döner; kartlar arkadaş ekleme göstermez.
      if (friendResult.status === "fulfilled") {
        setFriendIds(friendResult.value);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, i18n.t("discover:loadFailed")));
    } finally {
      if (mode === "initial") {
        setIsLoading(false);
      } else if (mode === "refresh") {
        setIsRefreshing(false);
      }
    }
  }, []);

  const changeScope = useCallback(
    (next: DiscoverScope) => {
      if (next === scopeRef.current) {
        return;
      }
      scopeRef.current = next;
      setScope(next);
      void load("initial");
    },
    [load],
  );

  const hasLoadedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      void load(hasLoadedRef.current ? "silent" : "initial").finally(() => {
        hasLoadedRef.current = true;
      });
    }, [load]),
  );

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
    async (post: ApiPost, content: string): Promise<ApiComment> => {
      const comment = await createComment(post.id, content);
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
    ): Promise<ApiComment> => {
      const reply = await createReply(post.id, parentCommentId, content);
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
    scope,
    setScope: changeScope,
    isLoading,
    isRefreshing,
    error,
    refresh: () => load("refresh"),
    toggleLike,
    addComment,
    addReply,
  };
}
