import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Pressable, View } from "react-native";

import { AppText as Text, Button } from "@/components";
import { themeColors } from "@/constants/theme";
import { listEventPosts } from "@/features/feed/services/posts-service";
import type { ApiPost } from "@/features/feed/types";
import { resolveMediaUrl } from "@/utils/media-url";

type EventMomentsSectionProps = {
  eventId: string;
  eventTitle: string;
  /** Etkinlik bitti ve kullanıcı organizatör ya da katılımcı. */
  canShare: boolean;
};

const MAX_PREVIEW = 6;

/**
 * "Maçtan kareler": etkinliğe bağlı gönderiler ve katılanlar için paylaşma
 * düğmesi. Paylaşamayan biri için gönderi yoksa bölüm hiç görünmüyor.
 */
export function EventMomentsSection({
  eventId,
  eventTitle,
  canShare,
}: EventMomentsSectionProps) {
  const { t } = useTranslation("eventDetail");
  const router = useRouter();
  const [posts, setPosts] = useState<ApiPost[]>([]);

  // Paylaşım ekranından dönünce yeni gönderi hemen görünsün.
  useFocusEffect(
    useCallback(() => {
      void listEventPosts(eventId)
        .then((page) => setPosts(page.items))
        .catch(() => undefined);
    }, [eventId]),
  );

  if (!canShare && posts.length === 0) {
    return null;
  }

  const share = () =>
    router.push({
      pathname: "/posts/create",
      params: { eventId, eventTitle },
    });

  const preview = posts.slice(0, MAX_PREVIEW);

  return (
    <View className="gap-3 rounded-3xl border border-white/10 bg-background-secondary/55 p-4">
      <View className="gap-0.5">
        <Text className="font-body-bold text-body text-text-primary">
          {t("moments.title")}
        </Text>
        <Text className="text-caption text-text-secondary">
          {posts.length > 0
            ? t("moments.count", { count: posts.length })
            : t("moments.empty")}
        </Text>
      </View>

      {preview.length > 0 ? (
        <View className="flex-row flex-wrap gap-1.5">
          {preview.map((post) => {
            const cover = post.media[0];
            return (
              <Pressable
                key={post.id}
                accessibilityRole="button"
                onPress={() => router.push(`/posts/${post.id}`)}
                className="aspect-square overflow-hidden rounded-xl bg-surface-secondary active:opacity-80"
                style={{ width: "32%" }}
              >
                {cover ? (
                  <Image
                    source={{ uri: resolveMediaUrl(cover.storagePath) }}
                    resizeMode="cover"
                    className="h-full w-full"
                  />
                ) : (
                  <View className="h-full w-full items-center justify-center p-2">
                    <FontAwesome6
                      name="quote-left"
                      size={14}
                      color={themeColors.text.tertiary}
                    />
                    <Text
                      numberOfLines={3}
                      className="mt-1 text-center text-caption text-text-secondary"
                    >
                      {post.content}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {canShare ? (
        <Button label={t("moments.share")} size="sm" onPress={share} />
      ) : null}
    </View>
  );
}
