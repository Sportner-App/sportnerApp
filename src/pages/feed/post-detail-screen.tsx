import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";

import { AppScreen, Button, ScreenHeader, SportLoader } from "@/components";
import { useToast } from "@/contexts";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  createComment,
  getPost,
  listComments,
} from "@/services/social-service";
import type { ApiComment, ApiPost } from "@/types/social";

export function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const [post, setPost] = useState<ApiPost | null>(null);
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    if (!id) return;
    try {
      const [nextPost, page] = await Promise.all([
        getPost(id),
        listComments(id),
      ]);
      setPost(nextPost);
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

  return (
    <AppScreen
      keyboardAvoiding
      header={<ScreenHeader title="GÖNDERİ" showBack />}
      contentClassName="gap-4 px-6 pt-3"
    >
      {isLoading || !post ? (
        <View className="items-center py-16">
          <SportLoader size={120} label="Yükleniyor" />
        </View>
      ) : (
        <>
          <Text className="font-body text-xs text-brand-neutral">
            {post.firstName || post.username}
          </Text>
          <Text className="font-body text-base text-white">{post.content}</Text>
          <Button
            label="Şikayet et"
            variant="outline"
            size="sm"
            onPress={() =>
              router.push({
                pathname: "/report",
                params: { entityType: "2", entityId: post.id },
              })
            }
          />

          <Text className="font-display text-base text-white">Yorumlar</Text>
          {comments.map((comment) => (
            <View
              key={comment.id}
              className="rounded-2xl border border-white/10 px-3 py-2.5"
            >
              <Text className="font-body text-xs text-brand-neutral">
                {comment.firstName || comment.username}
              </Text>
              <Text className="font-body text-sm text-white">
                {comment.content}
              </Text>
            </View>
          ))}

          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Yorum yaz…"
            placeholderTextColor="#64748b"
            className="rounded-2xl border border-white/10 px-4 py-3 font-body text-white"
          />
          <Button
            label="Yorum gönder"
            disabled={!draft.trim()}
            onPress={async () => {
              if (!id) return;
              await createComment(id, draft.trim());
              setDraft("");
              await load();
            }}
          />
        </>
      )}
    </AppScreen>
  );
}
