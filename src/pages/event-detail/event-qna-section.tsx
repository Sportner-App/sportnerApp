import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Avatar, Button, Input } from "@/components";
import { useToast } from "@/contexts";
import { themeColors, typeStyles } from "@/constants/theme";
import { getApiErrorMessage, isApiError } from "@/lib/api/errors";
import {
  askEventQuestion,
  listEventQuestions,
  replyToEventQuestion,
} from "@/services/event-qna-service";
import { EVENT_QNA_ROLE, type ApiEventQuestion } from "@/types/event-qna";
import type { EventDetail } from "@/types/events";
import { hasEventEnded } from "@/utils/events";
import { successNotification } from "@/utils/haptics";

const MIN_LENGTH = 5;
const MAX_LENGTH = 1000;

type EventQnASectionProps = {
  event: EventDetail;
  isOrganizer: boolean;
  onOpenUser: (userId: string) => void;
};

export function EventQnASection({
  event,
  isOrganizer,
  onOpenUser,
}: EventQnASectionProps) {
  const { showToast } = useToast();
  const [items, setItems] = useState<ApiEventQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [replyDraft, setReplyDraft] = useState("");
  const [replyingTo, setReplyingTo] = useState<ApiEventQuestion | null>(null);
  const [saving, setSaving] = useState(false);
  const ended = hasEventEnded(event);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const page = await listEventQuestions(event.id);
      setItems(page.items);
    } catch (error) {
      showToast({
        type: "error",
        title: "Sorular yüklenemedi",
        description: getApiErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  }, [event.id, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const canAsk = !ended && !isOrganizer;
  const canReply = !ended;

  const submitQuestion = async () => {
    const content = draft.trim();
    if (content.length < MIN_LENGTH || saving) {
      return;
    }

    setSaving(true);
    try {
      const created = await askEventQuestion(event.id, content);
      setItems((current) => [created, ...current]);
      setDraft("");
      successNotification();
    } catch (error) {
      showToast({
        type: "error",
        title: "Soru gönderilemedi",
        description:
          isApiError(error) && error.status === 429
            ? "Çok sık soru soruyorsun. Biraz bekle."
            : getApiErrorMessage(error),
      });
    } finally {
      setSaving(false);
    }
  };

  const submitReply = async () => {
    const target = replyingTo;
    const content = replyDraft.trim();
    if (!target || content.length < MIN_LENGTH || saving) {
      return;
    }

    const rootId = target.parentId ?? target.id;
    setSaving(true);
    try {
      const created = await replyToEventQuestion(event.id, target.id, content);
      setItems((current) =>
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
        title: "Yanıt gönderilemedi",
        description: getApiErrorMessage(error),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(180)} className="gap-md">
      <View className="flex-row items-end justify-between">
        <Text style={[typeStyles.label, { color: themeColors.text.secondary }]}>
          Sorular
        </Text>
        {items.length > 0 ? (
          <Text className="font-body text-[12px] text-text-tertiary">
            {items.length} soru
          </Text>
        ) : null}
      </View>

      <Text className="font-body text-[13px] leading-5 text-text-secondary">
        Katılmadan önce etkinlik sahibine sor. Cevaplar herkese açık.
      </Text>

      {isLoading ? (
        <Text className="font-body text-[13px] text-text-tertiary">
          Sorular yükleniyor…
        </Text>
      ) : items.length === 0 ? (
        <Text className="font-body text-[14px] text-text-secondary">
          {ended
            ? "Bu etkinlikte soru sorulmamış."
            : "Henüz soru yok. İlk soruyu sen sor."}
        </Text>
      ) : (
        <View className="gap-4">
          {items.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              canReply={canReply}
              onOpenUser={onOpenUser}
              onReply={(item) => {
                setReplyingTo(item);
                setReplyDraft("");
              }}
            />
          ))}
        </View>
      )}

      {canAsk ? (
        <View className="gap-2">
          <Input
            label="Sorun"
            value={draft}
            onChangeText={setDraft}
            multiline
            maxLength={MAX_LENGTH}
            placeholder="Park yeri var mı, raket getirmeli miyim…"
            helperText={`${draft.trim().length}/${MAX_LENGTH}`}
            style={{ minHeight: 88, paddingTop: 10, paddingBottom: 10 }}
            textAlignVertical="top"
          />
          <Button
            label="Soru sor"
            size="sm"
            disabled={draft.trim().length < MIN_LENGTH}
            isLoading={saving && !replyingTo}
            onPress={() => void submitQuestion()}
          />
        </View>
      ) : null}

      {ended ? (
        <Text className="font-body text-[12px] text-text-tertiary">
          Etkinlik bittiği için yeni soru veya yanıt yazılamaz.
        </Text>
      ) : null}

      {canReply && replyingTo ? (
        <View className="gap-2 rounded-2xl border border-border-default bg-background-secondary px-3 py-3">
          <View className="flex-row items-center justify-between">
            <Text className="flex-1 font-body text-[12px] text-text-secondary">
              {replyingTo.username || replyingTo.firstName || "Sporcu"} kişisine
              yanıt
            </Text>
            <Pressable hitSlop={8} onPress={() => setReplyingTo(null)}>
              <Text className="font-body-bold text-[12px] text-text-secondary">
                Vazgeç
              </Text>
            </Pressable>
          </View>
          <Input
            value={replyDraft}
            onChangeText={setReplyDraft}
            multiline
            maxLength={MAX_LENGTH}
            placeholder="Yanıtını yaz…"
            style={{ minHeight: 72, paddingTop: 10, paddingBottom: 10 }}
            textAlignVertical="top"
          />
          <Button
            label={isOrganizer ? "Cevapla" : "Yanıtla"}
            size="sm"
            disabled={replyDraft.trim().length < MIN_LENGTH}
            isLoading={saving && Boolean(replyingTo)}
            onPress={() => void submitReply()}
          />
        </View>
      ) : null}
    </Animated.View>
  );
}

function QuestionCard({
  question,
  canReply,
  onOpenUser,
  onReply,
}: {
  question: ApiEventQuestion;
  canReply: boolean;
  onOpenUser: (userId: string) => void;
  onReply: (item: ApiEventQuestion) => void;
}) {
  return (
    <View className="gap-3">
      <QnARow
        item={question}
        canReply={canReply}
        onOpenUser={onOpenUser}
        onReply={onReply}
      />
      {(question.replies ?? []).map((reply) => (
        <View key={reply.id} className="ml-8">
          <QnARow
            item={reply}
            canReply={canReply}
            onOpenUser={onOpenUser}
            onReply={onReply}
          />
        </View>
      ))}
    </View>
  );
}

function QnARow({
  item,
  canReply,
  onOpenUser,
  onReply,
}: {
  item: ApiEventQuestion;
  canReply: boolean;
  onOpenUser: (userId: string) => void;
  onReply: (item: ApiEventQuestion) => void;
}) {
  const name = item.username?.trim() || item.firstName?.trim() || "Sporcu";
  const mention = item.replyToUsername?.trim();
  const badge =
    item.authorRole === EVENT_QNA_ROLE.organizer
      ? { label: "Etkinlik sahibi", tone: "owner" as const }
      : item.authorRole === EVENT_QNA_ROLE.participant
        ? { label: "Katılımcı", tone: "member" as const }
        : null;

  return (
    <View className="flex-row items-start gap-2.5">
      <Pressable onPress={() => onOpenUser(item.authorUserId)} className="mt-0.5">
        <Avatar
          uri={item.profileImageUrl}
          name={name}
          size={item.parentId ? 24 : 32}
          borderWidth={0}
        />
      </Pressable>
      <View className="min-w-0 flex-1 gap-1">
        <View className="flex-row flex-wrap items-center gap-1.5">
          <Pressable onPress={() => onOpenUser(item.authorUserId)}>
            <Text className="font-body-bold text-[13px] text-text-primary">
              {name}
            </Text>
          </Pressable>
          {badge ? (
            <View
              className={`rounded-full px-2 py-0.5 ${
                badge.tone === "owner"
                  ? "bg-brand-primary/15"
                  : "bg-background-secondary"
              }`}
            >
              <Text
                className={`font-mono text-[9px] uppercase tracking-wide ${
                  badge.tone === "owner"
                    ? "text-brand-primary"
                    : "text-text-tertiary"
                }`}
              >
                {badge.label}
              </Text>
            </View>
          ) : null}
        </View>
        <Text className="font-body text-[14px] leading-5 text-text-primary">
          {mention ? (
            <Text className="font-body-bold text-brand-primary">@{mention} </Text>
          ) : null}
          {item.content}
        </Text>
        {canReply ? (
          <Pressable
            hitSlop={8}
            onPress={() => onReply(item)}
            className="self-start py-0.5"
          >
            <Text className="font-body text-[12px] font-semibold text-text-secondary">
              Yanıtla
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
