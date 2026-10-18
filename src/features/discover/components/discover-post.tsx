import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Pressable, useWindowDimensions, View } from "react-native";
import { ScrollView as GestureScrollView } from "react-native-gesture-handler";

import { AppText as Text, Avatar } from "@/components";
import { CommentsSheet } from "@/features/feed/components/comments-sheet";
import { useSession, useToast } from "@/contexts";
import { HIT_SLOP, themeColors } from "@/constants/theme";
import { getApiErrorMessage, isApiError } from "@/lib/api/errors";
import { sendFriendRequest } from "@/features/social/services/social-service";
import type { ApiComment, ApiPost } from "@/features/feed/types";
import { POST_MEDIA_TYPE } from "@/features/feed/types";
import { lightImpact } from "@/utils/haptics";
import { resolveMediaUrl } from "@/utils/media-url";
import { formatRelativeTime } from "@/utils/relative-time";
import { displayHandle } from "@/utils/person";

type DiscoverPostProps = {
  post: ApiPost;
  onLike: () => Promise<void>;
  onComment: (
    content: string,
    mentionedUserIds: string[],
  ) => Promise<ApiComment>;
  onReply: (
    parent: ApiComment,
    content: string,
    mentionedUserIds: string[],
  ) => Promise<ApiComment>;
  onAuthorPress: () => void;
  isFriend: boolean;
};

export function DiscoverPost({
  post,
  onLike,
  onComment,
  onReply,
  onAuthorPress,
  isFriend,
}: DiscoverPostProps) {
  const { width } = useWindowDimensions();
  /** Tam bleed akış: medya ekran genişliğini kullanır. */
  const mediaWidth = width;
  const { showToast } = useToast();
  const { t } = useTranslation(["social", "events", "common"]);
  const lastTap = useRef(0);
  const [page, setPage] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [heartBurst, setHeartBurst] = useState(false);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  const { user } = useSession();
  const isOwnPost = user?.id === post.userId;
  const canAddFriend = Boolean(user) && !isOwnPost && !isFriend;

  const addFriend = async () => {
    if (isAddingFriend) {
      return;
    }

    setIsAddingFriend(true);
    try {
      await sendFriendRequest(post.userId);
      setFriendRequestSent(true);
    } catch (error) {
      // Zaten istek varsa sunucu 409 döner; kullanıcı için sonuç yine "gönderildi".
      if (isApiError(error) && error.status === 409) {
        setFriendRequestSent(true);
        return;
      }
      showToast({
        type: "error",
        title: t("social:friend.requestFailed"),
        description: getApiErrorMessage(error),
      });
    } finally {
      setIsAddingFriend(false);
    }
  };

  const author =
    post.firstName || post.username || t("events:fallback.athlete");
  const athleteHandle = displayHandle(post.username);
  const images = post.media.filter(
    (item) => item.mediaType === POST_MEDIA_TYPE.image,
  );
  const videos = post.media.filter(
    (item) => item.mediaType === POST_MEDIA_TYPE.video,
  );
  const caption = post.content?.trim() ?? "";

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
        title: t("social:toasts.likeFailed"),
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

  return (
    <View>
      <View className="mb-2.5 flex-row items-center gap-3 px-4">
        <Pressable
          onPress={onAuthorPress}
          className="flex-1 flex-row items-center gap-3 active:opacity-75"
        >
          <Avatar uri={post.profileImageUrl} name={author} size={38} />
          <View className="flex-1">
            <Text className="font-body-bold text-body-sm text-text-primary">
              @{athleteHandle}
            </Text>
            <Text className="mt-0.5 font-body-bold text-overline text-text-tertiary">
              {formatRelativeTime(post.createdAt)}
            </Text>
          </View>
        </Pressable>

        {canAddFriend ? (
          <Pressable
            hitSlop={HIT_SLOP}
            disabled={friendRequestSent || isAddingFriend}
            onPress={() => void addFriend()}
            className="active:opacity-70"
          >
            <Text
              className={`font-body-bold text-caption ${
                friendRequestSent ? "text-text-tertiary" : "text-brand-primary"
              }`}
            >
              {friendRequestSent
                ? t("social:friend.requestSent")
                : t("social:friend.add")}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <Pressable onPress={handleMediaPress} className="bg-background-secondary">
        {images.length > 0 ? (
          <GestureScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              setPage(
                Math.round(event.nativeEvent.contentOffset.x / mediaWidth),
              );
            }}
          >
            {images.map((item) => (
              <Image
                key={item.id}
                source={{ uri: resolveMediaUrl(item.storagePath) }}
                style={{ width: mediaWidth, height: mediaWidth * 1.03 }}
              />
            ))}
          </GestureScrollView>
        ) : (
          <View
            className="justify-center bg-background-secondary px-6"
            style={{ width: mediaWidth, height: mediaWidth * 0.9 }}
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
                <Text className="text-center font-body text-body-sm text-text-secondary">
                  {t("social:videoShare")}
                </Text>
              </View>
            ) : (
              <Text className="font-display text-heading-md text-text-primary">
                {caption || t("social:fallback.post")}
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

      <View className="gap-3 px-4 pt-3">
        <View className="flex-row items-center gap-2">
          <Pressable
            hitSlop={HIT_SLOP}
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
            <Text className="font-body-bold text-caption text-text-primary">
              {post.likeCount}
            </Text>
          </Pressable>
          <Pressable
            hitSlop={HIT_SLOP}
            onPress={() => setCommentsOpen(true)}
            className="min-h-9 flex-row items-center gap-2 rounded-full border border-border-default bg-background-secondary px-3"
          >
            <FontAwesome6
              name="comment"
              size={17}
              color={themeColors.text.primary}
            />
            <Text className="font-body-bold text-caption text-text-primary">
              {post.commentCount}
            </Text>
          </Pressable>
        </View>

        {caption && images.length > 0 ? (
          <Text className="font-body text-body-sm leading-5 text-text-primary">
            <Text className="font-body-bold">{athleteHandle} </Text>
            {caption}
          </Text>
        ) : null}

        <Pressable onPress={() => setCommentsOpen(true)}>
          <Text className="font-body text-body-sm text-text-secondary">
            {post.commentCount > 0
              ? t("social:viewComments", { count: post.commentCount })
              : t("social:comments.placeholder")}
          </Text>
        </Pressable>
      </View>

      {/* Yorumlar kartın içinde değil: yazarken ve okurken ekranın tamamı
          kullanılıyor, klavye açıldığında yorumlar kaybolmuyor. */}
      <CommentsSheet
        visible={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        post={post}
        onComment={onComment}
        onReply={onReply}
      />
    </View>
  );
}
