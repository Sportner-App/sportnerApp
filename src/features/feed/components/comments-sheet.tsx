import { useEffect, useState } from "react";
import { Pressable, useWindowDimensions, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { AppText as Text } from "@/components/app-text";
import { AppTextInput } from "@/components/app-text-input";
import { BottomSheet } from "@/components/bottom-sheet";
import { themeColors, HIT_SLOP } from "@/constants/theme";
import { useToast } from "@/contexts/toast-provider";
import { CommentThread } from "@/features/feed/components/comment-thread";
import { MentionSuggestionList } from "@/features/feed/components/mention-suggestion-list";
import { useMentionComposer } from "@/features/feed/hooks/use-mention-composer";
import { listComments } from "@/features/feed/services/posts-service";
import type { ApiComment, ApiPost } from "@/features/feed/types";
import { getApiErrorMessage } from "@/lib/api/errors";

/**
 * Yorumlar, gönderi kartının içinde değil tam sayfa bir sheet'te.
 *
 * Kart içinde açıldığında okunabilir alan akışın kalanıyla paylaşılıyordu:
 * birkaç yorumdan sonrası görünmüyor, yazarken klavye kalan yeri de alıyordu.
 * Aksiyon alınan her yerde ekranın tamamını kullanmak uygulamanın geri
 * kalanıyla da tutarlı (şehir ve filtre seçicileri zaten böyle).
 *
 * Etiketlerken yorum listesi yerini kişi listesine bırakır; giriş alanı
 * sheet'in altında sabit kalır.
 */
export function CommentsSheet({
  visible,
  onClose,
  post,
  onComment,
  onReply,
}: {
  visible: boolean;
  onClose: () => void;
  post: ApiPost;
  onComment: (
    content: string,
    mentionedUserIds: string[],
  ) => Promise<ApiComment>;
  onReply: (
    parent: ApiComment,
    content: string,
    mentionedUserIds: string[],
  ) => Promise<ApiComment>;
}) {
  const router = useRouter();
  const { t } = useTranslation(["social", "common"]);
  const { showToast } = useToast();

  const [draft, setDraft] = useState("");
  const mention = useMentionComposer(draft);
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [replyingTo, setReplyingTo] = useState<ApiComment | null>(null);
  const [incomingReply, setIncomingReply] = useState<ApiComment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { height: windowHeight } = useWindowDimensions();
  /**
   * Gövdeye taban yükseklik: sheet içeriğine göre büyüyor, ama iki yorumluk
   * bir gönderide avuç içi kadar açılıp sonra yorum geldikçe zıplamasın.
   */
  const bodyMinHeight = Math.round(windowHeight * 0.45);

  useEffect(() => {
    if (!visible) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    void listComments(post.id)
      .then((page) => {
        if (!cancelled) {
          setComments(page.items);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          showToast({
            type: "error",
            title: t("social:toasts.commentsLoadFailed"),
            description: getApiErrorMessage(error),
          });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [post.id, showToast, t, visible]);

  const submit = async () => {
    const text = draft.trim();
    if (!text || isSending) {
      return;
    }

    setIsSending(true);
    try {
      if (replyingTo) {
        const reply = await onReply(replyingTo, text, mention.mentionedUserIds);
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
      } else {
        const comment = await onComment(text, mention.mentionedUserIds);
        setDraft("");
        setComments((current) => [...current, comment]);
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
      setIsSending(false);
    }
  };

  const replyUsername = replyingTo?.username ?? "";

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={t("social:comments.title")}
      showCancel={false}
      footer={
        <View className="gap-2">
          {replyingTo ? (
            <View className="flex-row items-center justify-between px-1">
              <Text className="flex-1 font-body text-caption text-text-secondary">
                {t("social:comments.replyTo", { username: replyUsername })}
              </Text>
              <Pressable hitSlop={HIT_SLOP} onPress={() => setReplyingTo(null)}>
                <Text className="font-body-bold text-caption text-brand-primary">
                  {t("common:cancel")}
                </Text>
              </Pressable>
            </View>
          ) : null}

          <View className="flex-row items-end gap-2 rounded-3xl border border-border-default bg-background-secondary px-4 py-1">
            <AppTextInput
              value={draft}
              onChangeText={setDraft}
              onSelectionChange={(event) =>
                mention.onSelectionChange(event.nativeEvent.selection.start)
              }
              placeholder={
                replyingTo
                  ? t("social:comments.replyPlaceholder", {
                      username: replyUsername,
                    })
                  : t("social:comments.placeholder")
              }
              placeholderTextColor={themeColors.text.tertiary}
              // Yorum uzayınca yana değil alta sarsın; dört satırdan sonra
              // alan büyümeyi bırakıp kendi içinde kaydırılır.
              multiline
              textAlignVertical="top"
              style={{ minHeight: 44, maxHeight: 112, paddingTop: 12 }}
              className="flex-1 font-body text-body-sm text-text-primary"
            />
            <Pressable
              hitSlop={HIT_SLOP}
              disabled={!draft.trim() || isSending}
              onPress={() => void submit()}
            >
              <Text
                className={`font-body-bold text-body-sm ${
                  draft.trim() ? "text-brand-primary" : "text-text-tertiary"
                }`}
              >
                {t("social:comments.share")}
              </Text>
            </Pressable>
          </View>
        </View>
      }
    >
      <View style={{ minHeight: bodyMinHeight }}>
        {mention.isPicking ? (
          <MentionSuggestionList
            suggestions={mention.suggestions}
            emptyLabel={t("social:mentions.empty")}
            onSelect={(candidate) => {
              const next = mention.apply(candidate);
              if (next !== null) setDraft(next);
            }}
          />
        ) : isLoading ? (
          <Text className="px-1 py-4 font-body text-body-sm text-text-tertiary">
            {t("social:comments.loading")}
          </Text>
        ) : comments.length === 0 ? (
          <Text className="px-1 py-4 font-body text-body-sm text-text-tertiary">
            {t("social:comments.firstComment")}
          </Text>
        ) : (
          <CommentThread
            postId={post.id}
            comments={comments}
            incomingReply={incomingReply}
            variant="detail"
            onReply={setReplyingTo}
            onAuthorPress={(userId) => {
              onClose();
              router.push(`/users/${userId}`);
            }}
          />
        )}
      </View>
    </BottomSheet>
  );
}
