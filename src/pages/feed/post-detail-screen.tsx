import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  Pressable,
  ScrollView,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { ScrollView as GestureScrollView } from "react-native-gesture-handler";

import {
  AppScreen,
  Avatar,
  Button,
  CommentThread,
  ScreenHeader,
  SportLoader,
} from "@/components";
import { useToast } from "@/contexts";
import { useScrollToSection } from "@/hooks/use-scroll-to-section";
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
import { AppText as Text } from "@/components/app-text";

export function PostDetailScreen() {
  const { id, focus } = useLocalSearchParams<{ id: string; focus?: string }>();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { showToast } = useToast();
  const { t } = useTranslation(["feed", "social", "events", "common"]);
  const [post, setPost] = useState<ApiPost | null>(null);
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ApiComment | null>(null);
  const [incomingReply, setIncomingReply] = useState<ApiComment | null>(null);
  const [mediaPage, setMediaPage] = useState(0);

  const scrollRef = useRef<ScrollView>(null);
  const { registerSection, scrollToSection } = useScrollToSection(scrollRef);
  const hasAppliedFocusRef = useRef(false);

  useEffect(() => {
    if (
      focus !== "comments" ||
      hasAppliedFocusRef.current ||
      isLoading ||
      !post
    ) {
      return;
    }
    hasAppliedFocusRef.current = true;
    const timeout = setTimeout(() => scrollToSection("comments"), 150);
    return () => clearTimeout(timeout);
  }, [focus, isLoading, post, scrollToSection]);

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
        title: t("social:toasts.loadFailed"),
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
        title: t("social:toasts.likeFailed"),
        description: getApiErrorMessage(error),
      });
    } finally {
      setIsLiking(false);
    }
  };

  const author =
    post?.firstName || post?.username || t("events:fallback.athlete");
  const replyUsername = replyingTo?.username || t("social:fallback.user");
  const images =
    post?.media.filter((item) => item.mediaType === POST_MEDIA_TYPE.image) ??
    [];

  return (
    <AppScreen
      scrollRef={scrollRef}
      keyboardAvoiding
      header={<ScreenHeader title={t("feed:detail.header")} showBack />}
      contentClassName="gap-4 pt-2"
    >
      {isLoading || !post ? (
        <View className="items-center px-6 py-16">
          <SportLoader size={120} label={t("common:loading")} />
        </View>
      ) : (
        <>
          <Pressable
            onPress={() => router.push(`/users/${post.userId}`)}
            className="flex-row items-center gap-3 px-6"
          >
            <Avatar uri={post.profileImageUrl} name={author} size={40} />
            <Text className="font-body text-body-sm font-semibold text-text-primary">
              @{post.username || t("events:fallback.athleteHandle")}
            </Text>
          </Pressable>

          {images.length > 0 ? (
            <>
              <GestureScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) => {
                  setMediaPage(
                    Math.round(event.nativeEvent.contentOffset.x / width),
                  );
                }}
              >
                {images.map((item) => (
                  <Image
                    key={item.id}
                    source={{ uri: resolveMediaUrl(item.storagePath) }}
                    style={{ width, height: width }}
                  />
                ))}
              </GestureScrollView>
              {images.length > 1 ? (
                <View className="flex-row justify-center gap-1">
                  {images.map((item, index) => (
                    <View
                      key={item.id}
                      className={`h-1.5 w-1.5 rounded-full ${
                        index === mediaPage
                          ? "bg-brand-primary"
                          : "bg-border-strong"
                      }`}
                    />
                  ))}
                </View>
              ) : null}
            </>
          ) : null}

          <View className="gap-4 px-6">
            {post.content?.trim() ? (
              <Text className="font-body text-body text-text-primary">
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
                <Text className="font-mono text-caption text-white">
                  {t("social:likesCount", { count: post.likeCount })}
                </Text>
              </Pressable>
              <View className="flex-row items-center gap-2">
                <FontAwesome6 name="comment" size={15} color="#94a3b8" />
                <Text className="font-mono text-caption text-brand-neutral">
                  {t("social:commentsCount", { count: post.commentCount })}
                </Text>
              </View>
            </View>

            <View ref={registerSection("comments")} className="gap-4">
              <Text className="font-display text-body text-text-primary">
                {t("social:comments.title")}
              </Text>
              {comments.length === 0 ? (
                <Text className="font-body text-body-sm text-brand-neutral">
                  {t("social:comments.firstComment")}
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
            </View>

            {replyingTo ? (
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 font-body text-caption text-brand-neutral">
                  {t("social:comments.replyTo", { username: replyUsername })}
                </Text>
                <Pressable hitSlop={8} onPress={() => setReplyingTo(null)}>
                  <Text className="font-body text-caption font-semibold text-brand-primary">
                    {t("common:cancel")}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={
                replyingTo
                  ? t("social:comments.replyPlaceholder", {
                      username: replyUsername,
                    })
                  : t("social:comments.placeholder")
              }
              placeholderTextColor="#64748b"
              className="rounded-2xl border border-border-default px-4 py-3 font-body text-text-primary"
            />
            <Button
              label={
                replyingTo
                  ? t("social:comments.sendReply")
                  : t("social:comments.sendComment")
              }
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
                      throw new Error(t("social:toasts.replyFailed"));
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
                      ? t("social:toasts.replyFailed")
                      : t("social:toasts.commentFailed"),
                    description: getApiErrorMessage(error),
                  });
                } finally {
                  setIsCommenting(false);
                }
              }}
            />

            <Button
              label={t("social:report")}
              variant="dangerOutline"
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
