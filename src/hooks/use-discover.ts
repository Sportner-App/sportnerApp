import { useCallback, useEffect, useState } from "react";

import { getApiErrorMessage } from "@/lib/api/errors";
import { explorePeople } from "@/services/events-service";
import {
  createComment,
  createReply,
  explorePosts,
  likePost,
  unlikePost,
} from "@/services/social-service";
import type { ApiComment, ApiPost } from "@/types/social";
import type { ExplorePerson } from "@/types/events";

export function useDiscover() {
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [people, setPeople] = useState<ExplorePerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (mode: "initial" | "refresh") => {
    if (mode === "initial") {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      setError(null);
      const [postResult, peopleResult] = await Promise.allSettled([
        explorePosts(36),
        explorePeople({ limit: 12 }),
      ]);

      if (postResult.status === "rejected") throw postResult.reason;
      setPosts(postResult.value);
      if (peopleResult.status === "fulfilled") {
        setPeople(peopleResult.value);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Keşfet yüklenemedi."));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load("initial");
  }, [load]);

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
        throw new Error("Yorum gönderilemedi.");
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
        throw new Error("Yanıt gönderilemedi.");
      }
      patchPost(post.id, { commentCount: post.commentCount + 1 });
      return reply;
    },
    [patchPost],
  );

  return {
    posts,
    people,
    isLoading,
    isRefreshing,
    error,
    refresh: () => load("refresh"),
    toggleLike,
    addComment,
    addReply,
  };
}
