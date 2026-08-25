import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useEffect, useRef, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { useToast } from "@/contexts";
import { getApiErrorMessage } from "@/lib/api/errors";
import { listComments } from "@/services/social-service";
import type { ApiComment, ApiPost } from "@/types/social";
import { POST_MEDIA_TYPE } from "@/types/social";
import { lightImpact } from "@/utils/haptics";
import { resolveMediaUrl } from "@/utils/media-url";

type DiscoverPostProps = {
  post: ApiPost;
  onLike: () => Promise<void>;
  onComment: (content: string) => Promise<ApiComment>;
  onAuthorPress: () => void;
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(Math.floor(diff / 60_000), 0);
  if (minutes < 1) return "şimdi";
  if (minutes < 60) return `${minutes} dk`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} gün`;
  return new Date(iso).toLocaleDateString("tr-TR");
}

export function DiscoverPost({
  post,
  onLike,
  onComment,
  onAuthorPress,
}: DiscoverPostProps) {
  const { width } = useWindowDimensions();
  const { showToast } = useToast();
  const lastTap = useRef(0);
  const [page, setPage] = useState(0);
  const [draft, setDraft] = useState("");
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [heartBurst, setHeartBurst] = useState(false);

  const author = post.firstName || post.username || "Sporcu";
  const images = post.media.filter(
    (item) => item.mediaType === POST_MEDIA_TYPE.image,
  );
  const videos = post.media.filter(
    (item) => item.mediaType === POST_MEDIA_TYPE.video,
  );
  const caption = post.content?.trim() ?? "";

  useEffect(() => {
    if (!commentsOpen) {
      return;
    }

    let cancelled = false;
    setIsLoadingComments(true);
    void listComments(post.id)
      .then((page) => {
        if (!cancelled) {
          setComments((current) => {
            const extras = current.filter(
              (comment) =>
                !page.items.some((item) => item.id === comment.id),
            );
            return [...page.items, ...extras];
          });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          showToast({
            type: "error",
            title: "Yorumlar yüklenemedi",
            description: getApiErrorMessage(error),
          });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingComments(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [commentsOpen, post.id, showToast]);

  const like = async () => {
    if (isLiking) {
      return;
    }

    setIsLiking(true);
    lightImpact();
    try {
      await onLike();
    } catch (error) {
      showToast({
        type: "error",
        title: "Beğenilemedi",
        description: getApiErrorMessage(error),
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleMediaPress = () => {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      lastTap.current = 0;
      setHeartBurst(true);
      if (!post.likedByMe) {
        void like();
      }
      setTimeout(() => setHeartBurst(false), 650);
      return;
    }
    lastTap.current = now;
  };

  const submitComment = async () => {
    const text = draft.trim();
    if (!text || isCommenting) {
      return;
    }

    setIsCommenting(true);
    try {
      const comment = await onComment(text);
      setDraft("");
      setCommentsOpen(true);
      setComments((current) => [...current, comment]);
    } catch (error) {
      showToast({
        type: "error",
        title: "Yorum gönderilemedi",
        description: getApiErrorMessage(error),
      });
    } finally {
      setIsCommenting(false);
    }
  };

  return (
    <View className="border-b border-white/10 pb-4">
      <Pressable
        onPress={onAuthorPress}
        className="flex-row items-center gap-3 px-4 py-3"
      >
        <View className="h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-brand-primary/15">
          {post.profileImageUrl ? (
            <Image
              source={{ uri: resolveMediaUrl(post.profileImageUrl) }}
              className="h-full w-full"
            />
          ) : (
            <Text className="font-display text-xs text-brand-primary">
              {author.slice(0, 1).toUpperCase()}
            </Text>
          )}
        </View>
        <View className="flex-1">
          <Text className="font-body text-sm font-semibold text-white">
            {author}
          </Text>
          <Text className="font-mono text-[10px] text-brand-neutral">
            {relativeTime(post.createdAt)}
          </Text>
        </View>
      </Pressable>

      <Pressable onPress={handleMediaPress}>
        {images.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              setPage(Math.round(event.nativeEvent.contentOffset.x / width));
            }}
          >
            {images.map((item) => (
              <Image
                key={item.id}
                source={{ uri: resolveMediaUrl(item.storagePath) }}
                style={{ width, height: width }}
              />
            ))}
          </ScrollView>
        ) : (
          <View
            className="justify-center bg-brand-surface px-6"
            style={{ width, height: width }}
          >
            {videos.length > 0 ? (
              <View className="items-center gap-3">
                <FontAwesome6 name="play" size={28} color="#ccff00" />
                <Text className="text-center font-body text-sm text-brand-neutral">
                  Video paylaşımı
                </Text>
              </View>
            ) : (
              <Text className="font-display text-2xl text-white">
                {caption || "Gönderi"}
              </Text>
            )}
          </View>
        )}

        {heartBurst ? (
          <View className="absolute inset-0 items-center justify-center">
            <FontAwesome6 name="heart" size={72} color="#ccff00" />
          </View>
        ) : null}
      </Pressable>

      {images.length > 1 ? (
        <View className="mt-2 flex-row justify-center gap-1">
          {images.map((item, index) => (
            <View
              key={item.id}
              className={`h-1.5 w-1.5 rounded-full ${
                index === page ? "bg-brand-primary" : "bg-white/25"
              }`}
            />
          ))}
        </View>
      ) : null}

      <View className="gap-3 px-4 pt-3">
        <View className="flex-row items-center gap-5">
          <Pressable
            hitSlop={8}
            onPress={() => void like()}
            className="flex-row items-center gap-2"
          >
            <FontAwesome6
              name="heart"
              size={20}
              color={post.likedByMe ? "#ccff00" : "#f8fafc"}
            />
            <Text className="font-mono text-xs text-white">
              {post.likeCount}
            </Text>
          </Pressable>
          <Pressable
            hitSlop={8}
            onPress={() => setCommentsOpen((open) => !open)}
            className="flex-row items-center gap-2"
          >
            <FontAwesome6 name="comment" size={19} color="#f8fafc" />
            <Text className="font-mono text-xs text-white">
              {post.commentCount}
            </Text>
          </Pressable>
        </View>

        {caption && images.length > 0 ? (
          <Text className="font-body text-sm text-white">
            <Text className="font-semibold">{author} </Text>
            {caption}
          </Text>
        ) : null}

        {post.commentCount > 0 && !commentsOpen ? (
          <Pressable onPress={() => setCommentsOpen(true)}>
            <Text className="font-body text-sm text-brand-neutral">
              {post.commentCount} yorumu gör
            </Text>
          </Pressable>
        ) : null}

        {commentsOpen ? (
          <View className="gap-2">
            {isLoadingComments ? (
              <Text className="font-body text-xs text-brand-neutral">
                Yorumlar yükleniyor…
              </Text>
            ) : comments.length === 0 ? (
              <Text className="font-body text-xs text-brand-neutral">
                İlk yorumu sen yaz.
              </Text>
            ) : (
              comments.map((comment) => (
                <Text key={comment.id} className="font-body text-sm text-white">
                  <Text className="font-semibold">
                    {comment.firstName || comment.username}{" "}
                  </Text>
                  {comment.content}
                </Text>
              ))
            )}
          </View>
        ) : null}

        <View className="flex-row items-center gap-2 rounded-full border border-white/10 bg-brand-surface/80 px-4">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onFocus={() => setCommentsOpen(true)}
            placeholder="Yorum yaz…"
            placeholderTextColor="#64748b"
            className="min-h-[44px] flex-1 font-body text-sm text-white"
          />
          <Pressable
            hitSlop={8}
            disabled={!draft.trim() || isCommenting}
            onPress={() => void submitComment()}
          >
            <Text
              className={`font-body text-sm font-semibold ${
                draft.trim() ? "text-brand-primary" : "text-brand-neutral"
              }`}
            >
              Paylaş
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
