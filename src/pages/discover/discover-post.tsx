import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
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

import { Avatar, CommentThread } from "@/components";
import { useToast } from "@/contexts";
import { themeColors } from "@/constants/theme";
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
  onReply: (parent: ApiComment, content: string) => Promise<ApiComment>;
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
  onReply,
  onAuthorPress,
}: DiscoverPostProps) {
  const { width } = useWindowDimensions();
  const cardWidth = width - 64;
  const router = useRouter();
  const { showToast } = useToast();
  const lastTap = useRef(0);
  const [page, setPage] = useState(0);
  const [draft, setDraft] = useState("");
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ApiComment | null>(null);
  const [incomingReply, setIncomingReply] = useState<ApiComment | null>(null);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [heartBurst, setHeartBurst] = useState(false);

  const author = post.username || post.firstName || "Sporcu";
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
              (comment) => !page.items.some((item) => item.id === comment.id),
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
      if (replyingTo) {
        const reply = await onReply(replyingTo, text);
        setDraft("");
        setCommentsOpen(true);
        setReplyingTo(null);
        setIncomingReply(reply);
        setComments((current) =>
          current.map((item) =>
            item.id === (reply.parentCommentId ?? replyingTo.id)
              ? { ...item, replyCount: item.replyCount + 1 }
              : item,
          ),
        );
      } else {
        const comment = await onComment(text);
        setDraft("");
        setCommentsOpen(true);
        setComments((current) => [...current, comment]);
      }
    } catch (error) {
      showToast({
        type: "error",
        title: replyingTo ? "Yanıt gönderilemedi" : "Yorum gönderilemedi",
        description: getApiErrorMessage(error),
      });
    } finally {
      setIsCommenting(false);
    }
  };

  return (
    <View className="rounded-[28px] border border-border-default bg-surface-primary p-3">
      <Pressable
        onPress={onAuthorPress}
        className="mb-3 flex-row items-center gap-3 px-1"
      >
        <Avatar uri={post.profileImageUrl} name={author} size={40} />
        <View className="flex-1">
          <Text className="font-body-bold text-sm text-text-primary">
            @{post.username || "sporcu"}
          </Text>
          <Text className="mt-0.5 font-mono text-[9px] text-text-tertiary">
            @{post.username || "sporcu"} · {relativeTime(post.createdAt)}
          </Text>
        </View>
        <View className="h-8 w-8 items-center justify-center rounded-full bg-background-secondary">
          <FontAwesome6
            name="ellipsis"
            size={12}
            color={themeColors.text.tertiary}
          />
        </View>
      </Pressable>

      <Pressable
        onPress={handleMediaPress}
        className="overflow-hidden rounded-[22px] bg-background-secondary"
      >
        {images.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              setPage(
                Math.round(event.nativeEvent.contentOffset.x / cardWidth),
              );
            }}
          >
            {images.map((item) => (
              <Image
                key={item.id}
                source={{ uri: resolveMediaUrl(item.storagePath) }}
                style={{ width: cardWidth, height: cardWidth * 1.03 }}
              />
            ))}
          </ScrollView>
        ) : (
          <View
            className="justify-center bg-background-secondary px-6"
            style={{ width: cardWidth, height: cardWidth * 0.9 }}
          >
            {videos.length > 0 ? (
              <View className="items-center gap-3">
                <View className="h-16 w-16 items-center justify-center rounded-full border border-brand-primary/40 bg-brand-primary/10">
                  <FontAwesome6
                    name="play"
                    size={22}
                    color={themeColors.brand.primary}
                  />
                </View>
                <Text className="text-center font-body text-sm text-text-secondary">
                  Video paylaşımı
                </Text>
              </View>
            ) : (
              <Text className="font-display text-2xl text-text-primary">
                {caption || "Gönderi"}
              </Text>
            )}
          </View>
        )}

        {heartBurst ? (
          <View className="absolute inset-0 items-center justify-center">
            <FontAwesome6
              name="heart"
              size={72}
              color={themeColors.brand.primary}
            />
          </View>
        ) : null}
      </Pressable>

      {images.length > 1 ? (
        <View className="mt-2 flex-row justify-center gap-1">
          {images.map((item, index) => (
            <View
              key={item.id}
              className={`h-1.5 w-1.5 rounded-full ${
                index === page ? "bg-brand-primary" : "bg-border-strong"
              }`}
            />
          ))}
        </View>
      ) : null}

      <View className="gap-3 px-1 pt-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Pressable
              hitSlop={8}
              onPress={() => void like()}
              className={`min-h-9 flex-row items-center gap-2 rounded-full border px-3 ${
                post.likedByMe
                  ? "border-brand-primary/30 bg-brand-primary/10"
                  : "border-border-default bg-background-secondary"
              }`}
            >
              <FontAwesome6
                name="heart"
                size={20}
                color={
                  post.likedByMe
                    ? themeColors.brand.primary
                    : themeColors.text.primary
                }
              />
              <Text className="font-mono text-xs text-text-primary">
                {post.likeCount}
              </Text>
            </Pressable>
            <Pressable
              hitSlop={8}
              onPress={() => setCommentsOpen((open) => !open)}
              className="min-h-9 flex-row items-center gap-2 rounded-full border border-border-default bg-background-secondary px-3"
            >
              <FontAwesome6
                name="comment"
                size={17}
                color={themeColors.text.primary}
              />
              <Text className="font-mono text-xs text-text-primary">
                {post.commentCount}
              </Text>
            </Pressable>
          </View>
          <View className="h-9 w-9 items-center justify-center rounded-full border border-border-default bg-background-secondary">
            <FontAwesome6
              name="bookmark"
              size={14}
              color={themeColors.text.secondary}
            />
          </View>
        </View>

        {caption && images.length > 0 ? (
          <Text className="font-body text-sm leading-5 text-text-primary">
            <Text className="font-semibold">{author} </Text>
            {caption}
          </Text>
        ) : null}

        {post.commentCount > 0 && !commentsOpen ? (
          <Pressable onPress={() => setCommentsOpen(true)}>
            <Text className="font-body text-sm text-text-secondary">
              {post.commentCount} yorumu gör
            </Text>
          </Pressable>
        ) : null}

        {commentsOpen ? (
          <View className="gap-2">
            {isLoadingComments ? (
              <Text className="font-body text-xs text-text-secondary">
                Yorumlar yükleniyor…
              </Text>
            ) : comments.length === 0 ? (
              <Text className="font-body text-xs text-text-secondary">
                İlk yorumu sen yaz.
              </Text>
            ) : (
              <CommentThread
                postId={post.id}
                comments={comments}
                incomingReply={incomingReply}
                onReply={(comment) => {
                  setReplyingTo(comment);
                  setCommentsOpen(true);
                }}
                onAuthorPress={(userId) => router.push(`/users/${userId}`)}
              />
            )}
          </View>
        ) : null}

        {replyingTo ? (
          <View className="flex-row items-center justify-between px-1">
            <Text className="flex-1 font-body text-xs text-text-secondary">
              {replyingTo.username || "kullanıcı"} kullanıcısına yanıt
            </Text>
            <Pressable hitSlop={8} onPress={() => setReplyingTo(null)}>
              <Text className="font-body text-xs font-semibold text-brand-primary">
                İptal
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View className="flex-row items-center gap-2 rounded-full border border-border-default bg-background-secondary px-4">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onFocus={() => setCommentsOpen(true)}
            placeholder={
              replyingTo
                ? `${replyingTo.username || "kullanıcı"} kullanıcısına yanıt ver…`
                : "Yorum yaz…"
            }
            placeholderTextColor={themeColors.text.tertiary}
            className="min-h-[44px] flex-1 font-body text-sm text-text-primary"
          />
          <Pressable
            hitSlop={8}
            disabled={!draft.trim() || isCommenting}
            onPress={() => void submitComment()}
          >
            <Text
              className={`font-body text-sm font-semibold ${
                draft.trim() ? "text-brand-primary" : "text-text-tertiary"
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
