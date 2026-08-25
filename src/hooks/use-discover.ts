import { useCallback, useEffect, useState } from "react";

import { getApiErrorMessage } from "@/lib/api/errors";
import {
  createComment,
  explorePosts,
  likePost,
  unlikePost,
} from "@/services/social-service";
import type { ApiComment, ApiPost } from "@/types/social";

export function useDiscover() {
  const [posts, setPosts] = useState<ApiPost[]>([]);
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
      setPosts(await explorePosts(36));
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
      current.map((post) =>
        post.id === postId ? { ...post, ...next } : post,
      ),
    );
  }, []);

  const toggleLike = useCallback(async (post: ApiPost) => {
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
  }, [patchPost]);

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

  return {
    posts,
    isLoading,
    isRefreshing,
    error,
    refresh: () => load("refresh"),
    toggleLike,
    addComment,
  };
}
