import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import {
  AppScreen,
  Avatar,
  Button,
  CommentThread,
  ScreenHeader,
  SportLoader,
} from "@/components";
import { useToast } from "@/contexts";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  createComment,
  createReply,
  getPost,
  likePost,
  listComments,
  unlikePost,
} from "@/services/social-service";
import type { ApiComment, ApiPost } from "@/types/social";
import { POST_MEDIA_TYPE } from "@/types/social";
import { resolveMediaUrl } from "@/utils/media-url";

export function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { showToast } = useToast();
  const [post, setPost] = useState<ApiPost | null>(null);
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ApiComment | null>(null);
  const [incomingReply, setIncomingReply] = useState<ApiComment | null>(null);

  const load = async () => {
    if (!id) return;
    try {
      const [nextPost, page] = await Promise.all([
        getPost(id),
        listComments(id),
      ]);
      setPost(nextPost ?? null);
      setComments(page.items);
    } catch (error) {
      showToast({
        type: "error",
        title: "Yüklenemedi",
        description: getApiErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const toggleLike = async () => {
    if (!post || isLiking) {
      return;
    }

    setIsLiking(true);
    const liked = post.likedByMe;
    setPost({
      ...post,
      likedByMe: !liked,
      likeCount: Math.max(post.likeCount + (liked ? -1 : 1), 0),
    });

    try {
      if (liked) {
        await unlikePost(post.id);
      } else {
        await likePost(post.id);
      }
    } catch (error) {
      setPost(post);
      showToast({
        type: "error",
        title: "Beğenilemedi",
        description: getApiErrorMessage(error),
      });
    } finally {
      setIsLiking(false);
    }
  };

  const author = post?.username || post?.firstName || "Sporcu";
  const images =
    post?.media.filter((item) => item.mediaType === POST_MEDIA_TYPE.image) ??
    [];

  return (
    <AppScreen
      keyboardAvoiding
      header={<ScreenHeader title="GÖNDERİ" showBack />}
      contentClassName="gap-4 pt-2"
    >
      {isLoading || !post ? (
        <View className="items-center px-6 py-16">
          <SportLoader size={120} label="Yükleniyor" />
        </View>
      ) : (
        <>
          <Pressable
            onPress={() => router.push(`/users/${post.userId}`)}
            className="flex-row items-center gap-3 px-6"
          >
            <Avatar uri={post.profileImageUrl} name={author} size={40} />
            <Text className="font-body text-sm font-semibold text-white">
              @{post.username || "sporcu"}
            </Text>
          </Pressable>

          {images.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
            >
              {images.map((item) => (
                <Image
                  key={item.id}
                  source={{ uri: resolveMediaUrl(item.storagePath) }}
                  style={{ width, height: width }}
                />
              ))}
            </ScrollView>
          ) : null}

          <View className="gap-4 px-6">
            {post.content?.trim() ? (
              <Text className="font-body text-base text-white">
                {post.content}
              </Text>
            ) : null}

            <View className="flex-row items-center gap-5">
              <Pressable
                onPress={() => void toggleLike()}
                className="flex-row items-center gap-2"
              >
                <FontAwesome6
                  name="heart"
                  size={16}
                  color={post.likedByMe ? "#ccff00" : "#94a3b8"}
                />
                <Text className="font-mono text-xs text-white">
                  {post.likeCount} beğeni
                </Text>
              </Pressable>
              <View className="flex-row items-center gap-2">
                <FontAwesome6 name="comment" size={15} color="#94a3b8" />
                <Text className="font-mono text-xs text-brand-neutral">
                  {post.commentCount} yorum
                </Text>
              </View>
            </View>

            <Text className="font-display text-base text-white">Yorumlar</Text>
            {comments.length === 0 ? (
              <Text className="font-body text-sm text-brand-neutral">
                İlk yorumu sen yaz.
              </Text>
            ) : (
              <CommentThread
                postId={post.id}
                comments={comments}
                incomingReply={incomingReply}
                variant="detail"
                onReply={setReplyingTo}
                onAuthorPress={(userId) => router.push(`/users/${userId}`)}
              />
            )}

            {replyingTo ? (
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 font-body text-xs text-brand-neutral">
                  {replyingTo.username || "kullanıcı"} kullanıcısına yanıt
                </Text>
                <Pressable hitSlop={8} onPress={() => setReplyingTo(null)}>
                  <Text className="font-body text-xs font-semibold text-brand-primary">
                    İptal
                  </Text>
                </Pressable>
              </View>
            ) : null}

            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={
                replyingTo
                  ? `${replyingTo.username || "kullanıcı"} kullanıcısına yanıt ver…`
                  : "Yorum yaz…"
              }
              placeholderTextColor="#64748b"
              className="rounded-2xl border border-white/10 px-4 py-3 font-body text-white"
            />
            <Button
              label={replyingTo ? "Yanıt gönder" : "Yorum gönder"}
              disabled={!draft.trim()}
              isLoading={isCommenting}
              onPress={async () => {
                if (!id || !draft.trim()) return;
                setIsCommenting(true);
                try {
                  if (replyingTo) {
                    const reply = await createReply(
                      id,
                      replyingTo.id,
                      draft.trim(),
                    );
                    if (!reply) {
                      throw new Error("Yanıt gönderilemedi.");
                    }
                    setDraft("");
                    setReplyingTo(null);
                    setIncomingReply(reply);
                    setComments((current) =>
                      current.map((item) =>
                        item.id === (reply.parentCommentId ?? replyingTo.id)
                          ? { ...item, replyCount: item.replyCount + 1 }
                          : item,
                      ),
                    );
                    setPost((current) =>
                      current
                        ? {
                            ...current,
                            commentCount: current.commentCount + 1,
                          }
                        : current,
                    );
                  } else {
                    const comment = await createComment(id, draft.trim());
                    if (comment) {
                      setComments((current) => [...current, comment]);
                      setPost((current) =>
                        current
                          ? {
                              ...current,
                              commentCount: current.commentCount + 1,
                            }
                          : current,
                      );
                    }
                    setDraft("");
                  }
                } catch (error) {
                  showToast({
                    type: "error",
                    title: replyingTo
                      ? "Yanıt gönderilemedi"
                      : "Yorum gönderilemedi",
                    description: getApiErrorMessage(error),
                  });
                } finally {
                  setIsCommenting(false);
                }
              }}
            />

            <Button
              label="Şikayet et"
              variant="ghost"
              size="sm"
              onPress={() =>
                router.push({
                  pathname: "/report",
                  params: { entityType: "2", entityId: post.id },
                })
              }
            />
          </View>
        </>
      )}
    </AppScreen>
  );
}
