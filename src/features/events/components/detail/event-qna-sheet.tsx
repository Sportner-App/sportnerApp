import { useState } from "react";
import { Pressable, useWindowDimensions, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText as Text, BottomSheet, Button, Input } from "@/components";
import { useToast } from "@/contexts";
import { HIT_SLOP } from "@/constants/theme";
import { getApiErrorMessage, isApiError } from "@/lib/api/errors";
import {
  askEventQuestion,
  replyToEventQuestion,
} from "@/features/events/services/event-qna-service";
import type { ApiEventQuestion, EventDetail } from "@/features/events/types";
import { MentionSuggestionList } from "@/features/feed/components/mention-suggestion-list";
import {
  useMentionComposer,
  type MentionCandidate,
} from "@/features/feed/hooks/use-mention-composer";
import { successNotification } from "@/utils/haptics";

export const QNA_MIN_LENGTH = 5;
export const QNA_MAX_LENGTH = 1000;

type EventQnASheetProps = {
  visible: boolean;
  onClose: () => void;
  event: EventDetail;
  isOrganizer: boolean;
  items: ApiEventQuestion[];
  isLoading: boolean;
  canAsk: boolean;
  canReply: boolean;
  onItemsChange: (
    update: (current: ApiEventQuestion[]) => ApiEventQuestion[],
  ) => void;
  searchAttendees: (query: string) => Promise<MentionCandidate[]>;
  renderQuestion: (
    question: ApiEventQuestion,
    onReply: (item: ApiEventQuestion) => void,
  ) => React.ReactNode;
};

/**
 * Soru-cevap, etkinlik sayfasının içinde değil alttan açılan sayfada.
 *
 * Satır içiyken soru yazma alanı sayfanın ortasında kalıyordu: klavye açılınca
 * sayfa kayıyor, etiket önerileri için de ayrı bir yer açmak gerekiyordu.
 * Keşfet yorumlarıyla aynı model — aksiyon alınırken ekranın tamamı kullanılır,
 * giriş alanı altta sabit durur.
 */
export function EventQnASheet({
  visible,
  onClose,
  event,
  isOrganizer,
  items,
  isLoading,
  canAsk,
  canReply,
  onItemsChange,
  searchAttendees,
  renderQuestion,
}: EventQnASheetProps) {
  const { t } = useTranslation(["eventDetail", "social", "events"]);
  const { showToast } = useToast();
  const { height: windowHeight } = useWindowDimensions();
  const [draft, setDraft] = useState("");
  const mention = useMentionComposer(draft, searchAttendees);
  const [replyDraft, setReplyDraft] = useState("");
  const [replyingTo, setReplyingTo] = useState<ApiEventQuestion | null>(null);
  const [saving, setSaving] = useState(false);

  const submitQuestion = async () => {
    const content = draft.trim();
    if (content.length < QNA_MIN_LENGTH || saving) {
      return;
    }

    setSaving(true);
    try {
      const created = await askEventQuestion(
        event.id,
        content,
        mention.mentionedUserIds,
      );
      onItemsChange((current) => [created, ...current]);
      setDraft("");
      successNotification();
    } catch (error) {
      showToast({
        type: "error",
        title: t("eventDetail:qna.askFailedTitle"),
        description:
          isApiError(error) && error.status === 429
            ? t("eventDetail:qna.askRateLimited")
            : getApiErrorMessage(error),
      });
    } finally {
      setSaving(false);
    }
  };

  const submitReply = async () => {
    const target = replyingTo;
    const content = replyDraft.trim();
    if (!target || content.length < QNA_MIN_LENGTH || saving) {
      return;
    }

    const rootId = target.parentId ?? target.id;
    setSaving(true);
    try {
      const created = await replyToEventQuestion(event.id, target.id, content);
      onItemsChange((current) =>
        current.map((question) =>
          question.id === rootId
            ? {
                ...question,
                replyCount: question.replyCount + 1,
                replies: [...(question.replies ?? []), created],
              }
            : question,
        ),
      );
      setReplyDraft("");
      setReplyingTo(null);
      successNotification();
    } catch (error) {
      showToast({
        type: "error",
        title: t("eventDetail:qna.replyFailedTitle"),
        description: getApiErrorMessage(error),
      });
    } finally {
      setSaving(false);
    }
  };

  const composer = replyingTo ? (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="flex-1 font-body text-caption text-text-secondary">
          {t("eventDetail:qna.replyingTo", {
            name:
              replyingTo.username ||
              replyingTo.firstName ||
              t("events:fallback.athlete"),
          })}
        </Text>
        <Pressable hitSlop={HIT_SLOP} onPress={() => setReplyingTo(null)}>
          <Text className="font-body-bold text-caption text-brand-primary">
            {t("eventDetail:qna.cancelReply")}
          </Text>
        </Pressable>
      </View>
      <Input
        value={replyDraft}
        onChangeText={setReplyDraft}
        multiline
        maxLength={QNA_MAX_LENGTH}
        placeholder={t("eventDetail:qna.replyPlaceholder")}
        style={{ minHeight: 72, paddingTop: 10, paddingBottom: 10 }}
        textAlignVertical="top"
      />
      <Button
        label={
          isOrganizer
            ? t("eventDetail:qna.replyOrganizer")
            : t("eventDetail:qna.replyParticipant")
        }
        size="sm"
        disabled={replyDraft.trim().length < QNA_MIN_LENGTH}
        isLoading={saving}
        onPress={() => void submitReply()}
      />
    </View>
  ) : canAsk ? (
    <View className="gap-2">
      <Input
        value={draft}
        onChangeText={setDraft}
        onSelectionChange={(event_) =>
          mention.onSelectionChange(event_.nativeEvent.selection.start)
        }
        multiline
        maxLength={QNA_MAX_LENGTH}
        placeholder={t("eventDetail:qna.askPlaceholder")}
        helperText={`${draft.trim().length}/${QNA_MAX_LENGTH}`}
        style={{ minHeight: 72, paddingTop: 10, paddingBottom: 10 }}
        textAlignVertical="top"
      />
      <Button
        label={t("eventDetail:qna.ask")}
        size="sm"
        disabled={draft.trim().length < QNA_MIN_LENGTH}
        isLoading={saving}
        onPress={() => void submitQuestion()}
      />
    </View>
  ) : null;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={
        isOrganizer
          ? t("eventDetail:qna.ownerHeading")
          : t("eventDetail:qna.heading")
      }
      subtitle={
        isOrganizer ? t("eventDetail:qna.ownerIntro") : t("eventDetail:qna.intro")
      }
      showCancel={!composer}
      footer={composer ?? undefined}
    >
      <View style={{ minHeight: Math.round(windowHeight * 0.4) }}>
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
          <Text className="py-4 font-body text-body-sm text-text-tertiary">
            {t("eventDetail:qna.loading")}
          </Text>
        ) : items.length === 0 ? (
          <Text className="py-4 font-body text-body-sm text-text-tertiary">
            {t(
              isOrganizer
                ? "eventDetail:qna.ownerEmptyOpen"
                : "eventDetail:qna.emptyOpen",
            )}
          </Text>
        ) : (
          <View className="gap-4">
            {items.map((question) => (
              <View key={question.id}>
                {renderQuestion(question, (item) => {
                  if (!canReply) return;
                  setReplyingTo(item);
                  setReplyDraft("");
                })}
              </View>
            ))}
          </View>
        )}
      </View>
    </BottomSheet>
  );
}
