import { useCallback, useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { AppText as Text, Avatar } from "@/components";
import { useToast } from "@/contexts";
import { HIT_SLOP, themeColors, typeStyles } from "@/constants/theme";
import { getApiErrorMessage } from "@/lib/api/errors";
import { listEventQuestions } from "@/features/events/services/event-qna-service";
import { EventQnASheet } from "@/features/events/components/detail/event-qna-sheet";
import { EVENT_QNA_ROLE, type ApiEventQuestion } from "@/features/events/types";
import type { EventDetail } from "@/features/events/types";
import { hasEventEnded } from "@/features/events/status";
import { MentionText } from "@/features/feed/components/mention-text";
import { type MentionCandidate } from "@/features/feed/hooks/use-mention-composer";
import { OrganizationImage } from "@/features/organizations/components/organization-image";
import { normalizeSearch } from "@/utils/search";

/** Sayfada yalnızca ilk sorular görünür; gerisi sheet'te. */
const PREVIEW_COUNT = 2;

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
  const { t } = useTranslation("eventDetail");
  const { showToast } = useToast();
  const router = useRouter();
  const [items, setItems] = useState<ApiEventQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  /**
   * Adaylar etkinliğe dahil olanlardan: soru-cevapta etiketlenmek istenen
   * kişiler organizatör ve diğer katılımcılar, arkadaş olmaları gerekmiyor.
   * Liste zaten istemcide olduğu için sorgu da gerekmiyor.
   */
  const searchAttendees = useCallback(
    async (query: string) => {
      const needle = normalizeSearch(query);
      const people: MentionCandidate[] = event.participants
        .filter((participant) => !participant.isGuest && participant.userId)
        .map((participant) => ({
          userId: participant.userId!,
          username: participant.username,
          firstName: participant.name,
          profileImageUrl: participant.avatarUrl,
        }));

      return people
        .filter(
          (person) =>
            person.username &&
            (!needle ||
              normalizeSearch(person.username).includes(needle) ||
              normalizeSearch(person.firstName ?? "").includes(needle)),
        )
        .slice(0, 8);
    },
    [event.participants],
  );

  const ended = hasEventEnded(event);
  const clubId = event.organizationId;
  const openClub = useCallback(
    (organizationId: string) => router.push(`/clubs/${organizationId}`),
    [router],
  );

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const page = await listEventQuestions(event.id);
      setItems(page.items);
    } catch (error) {
      showToast({
        type: "error",
        title: t("qna.loadFailedTitle"),
        description: getApiErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  }, [event.id, showToast, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const canAsk = !ended && !isOrganizer;
  const canReply = !ended;

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(180)}
      className="gap-md"
    >
      <View className="flex-row items-end justify-between">
        <Text style={[typeStyles.label, { color: themeColors.text.secondary }]}>
          {isOrganizer ? t("qna.ownerHeading") : t("qna.heading")}
        </Text>
        {items.length > 0 ? (
          <Text className="font-body text-caption text-text-tertiary">
            {t("qna.countLabel", { count: items.length })}
          </Text>
        ) : null}
      </View>

      <Text className="font-body text-label leading-5 text-text-secondary">
        {isOrganizer ? t("qna.ownerIntro") : t("qna.intro")}
      </Text>

      {isLoading ? (
        <Text className="font-body text-label text-text-tertiary">
          {t("qna.loading")}
        </Text>
      ) : items.length === 0 ? (
        <Text className="font-body text-body-sm text-text-secondary">
          {ended
            ? t(isOrganizer ? "qna.ownerEmptyEnded" : "qna.emptyEnded")
            : t(isOrganizer ? "qna.ownerEmptyOpen" : "qna.emptyOpen")}
        </Text>
      ) : (
        <View className="gap-4">
          {items.slice(0, PREVIEW_COUNT).map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              canReply={false}
              clubId={clubId}
              onOpenUser={onOpenUser}
              onOpenClub={openClub}
              onReply={() => setSheetOpen(true)}
            />
          ))}
        </View>
      )}

      {/* Soru yazmak ve okumak sheet'te: satır içi alan sayfanın ortasında
          kalıyordu, klavye açılınca sayfa kayıyordu. */}
      {items.length > PREVIEW_COUNT || canAsk || canReply ? (
        <Pressable
          onPress={() => setSheetOpen(true)}
          className="flex-row items-center gap-3 rounded-2xl border border-border-default bg-background-secondary px-4 py-3 active:opacity-70"
        >
          {/* Soldaki metin esner ve tek satırda kırpılır; "Soru sor" kısalmaz.
              İkisi de serbest bırakıldığında dar ekranlarda uzun yer tutucu
              butonu ekranın dışına itiyordu. */}
          <Text
            numberOfLines={1}
            className="flex-1 font-body text-body-sm text-text-secondary"
          >
            {items.length > PREVIEW_COUNT
              ? t("qna.seeAll", { count: items.length })
              : canAsk
                ? t("qna.askPlaceholder")
                : t("qna.heading")}
          </Text>
          <Text className="shrink-0 font-body-bold text-caption text-brand-primary">
            {canAsk ? t("qna.ask") : t("qna.open")}
          </Text>
        </Pressable>
      ) : null}

      {ended ? (
        <Text className="font-body text-caption text-text-tertiary">
          {t("qna.endedNotice")}
        </Text>
      ) : null}

      <EventQnASheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        event={event}
        isOrganizer={isOrganizer}
        items={items}
        isLoading={isLoading}
        canAsk={canAsk}
        canReply={canReply}
        onItemsChange={setItems}
        searchAttendees={searchAttendees}
        renderQuestion={(question, onReply) => (
          <QuestionCard
            question={question}
            canReply={canReply}
            clubId={clubId}
            onOpenUser={(userId) => {
              setSheetOpen(false);
              onOpenUser(userId);
            }}
            onOpenClub={(organizationId) => {
              setSheetOpen(false);
              openClub(organizationId);
            }}
            onReply={onReply}
          />
        )}
      />
    </Animated.View>
  );
}

function QuestionCard({
  question,
  canReply,
  clubId,
  onOpenUser,
  onOpenClub,
  onReply,
}: {
  question: ApiEventQuestion;
  canReply: boolean;
  clubId: string | null;
  onOpenUser: (userId: string) => void;
  onOpenClub: (organizationId: string) => void;
  onReply: (item: ApiEventQuestion) => void;
}) {
  return (
    <View className="gap-3">
      <QnARow
        item={question}
        canReply={canReply}
        clubId={clubId}
        onOpenUser={onOpenUser}
        onOpenClub={onOpenClub}
        onReply={onReply}
      />
      {(question.replies ?? []).map((reply) => (
        <View key={reply.id} className="ml-8">
          <QnARow
            item={reply}
            canReply={canReply}
            clubId={clubId}
            onOpenUser={onOpenUser}
            onOpenClub={onOpenClub}
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
  clubId,
  onOpenUser,
  onOpenClub,
  onReply,
}: {
  item: ApiEventQuestion;
  canReply: boolean;
  clubId: string | null;
  onOpenUser: (userId: string) => void;
  onOpenClub: (organizationId: string) => void;
  onReply: (item: ApiEventQuestion) => void;
}) {
  const { t } = useTranslation("eventDetail");
  // Kulüp adına verilen cevapta yazar kişi değil kulüp görünür.
  const clubName = item.answeredByClub ? item.clubName?.trim() || null : null;
  const name =
    clubName ||
    item.username?.trim() ||
    item.firstName?.trim() ||
    t("events:fallback.athlete");
  const mention = item.replyToUsername?.trim();
  const openAuthor = () =>
    clubName && clubId ? onOpenClub(clubId) : onOpenUser(item.authorUserId);
  const avatarSize = item.parentId ? 24 : 32;
  const badge = clubName
    ? { label: t("qna.roleClub"), tone: "owner" as const }
    : item.authorRole === EVENT_QNA_ROLE.organizer
      ? { label: t("qna.roleOwner"), tone: "owner" as const }
      : item.authorRole === EVENT_QNA_ROLE.participant
        ? { label: t("qna.roleMember"), tone: "member" as const }
        : null;

  return (
    <View className="flex-row items-start gap-2.5">
      <Pressable onPress={openAuthor} className="mt-0.5">
        {clubName ? (
          <OrganizationImage
            uri={item.clubImageUrl}
            name={clubName}
            size={avatarSize}
            radius={avatarSize * 0.3}
            textClassName="text-label"
          />
        ) : (
          <Avatar
            uri={item.profileImageUrl}
            name={name}
            size={avatarSize}
            borderWidth={0}
          />
        )}
      </Pressable>
      <View className="min-w-0 flex-1 gap-1">
        <View className="flex-row flex-wrap items-center gap-1.5">
          <Pressable onPress={openAuthor}>
            <Text className="font-body-bold text-label text-text-primary">
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
                className={`font-body-bold text-overline uppercase tracking-wide ${
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
        <Text className="font-body text-body-sm leading-5 text-text-primary">
          {mention ? (
            <Text className="font-body-bold text-brand-primary">
              @{mention}{" "}
            </Text>
          ) : null}
          <MentionText content={item.content} mentions={item.mentions} />
        </Text>
        {canReply ? (
          <Pressable
            hitSlop={HIT_SLOP}
            onPress={() => onReply(item)}
            className="self-start py-0.5"
          >
            <Text className="font-body-bold text-caption text-text-secondary">
              {t("qna.reply")}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
