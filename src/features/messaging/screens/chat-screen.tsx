import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, View } from "react-native";
import { useKeyboardHandler } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useKeyboardHeight } from "@/hooks/use-keyboard-height";

import { useMentionComposer } from "@/features/feed/hooks/use-mention-composer";
import { normalizeSearch } from "@/utils/search";
import {
  scrollTo,
  useAnimatedRef,
  useSharedValue,
} from "react-native-reanimated";

import {
  AppScreen,
  AppTextInput,
  Avatar,
  BottomSheet,
  EmptyState,
  ScreenHeader,
  AppText as Text,
} from "@/components";
import { HIT_SLOP, themeColors } from "@/constants/theme";
import { useSession, useToast } from "@/contexts";
import { connectEventChat } from "@/features/messaging/services/chat-realtime";
import {
  deleteConversation,
  getConversation,
  getEventConversation,
  listMessages,
  markConversationRead,
  sendTextMessage,
} from "@/features/messaging/services/messaging-service";
import {
  CONVERSATION_TYPE,
  type ApiConversation,
  type ApiMessage,
  type ChatMessage,
} from "@/features/messaging/types";
import { getCurrentLocale } from "@/i18n";
import { getApiErrorMessage, isApiError } from "@/lib/api/errors";

import { getEventById } from "@/features/events/services/events-service";
import { ChatBackground } from "@/features/messaging/chat-backgrounds";
import { ChatBackgroundSheet } from "@/features/messaging/components/chat-background-sheet";
import { MessageRow } from "@/features/messaging/components/message-row";
import { useChatBackground } from "@/features/messaging/hooks/use-chat-background";
import { confirmDestructive } from "@/utils/confirm";
import { resolveMediaUrl } from "@/utils/media-url";
import { displayHandle } from "@/utils/person";

/**
 * Sunucu yanıtı gelince iyimser baloncuğu gerçeğiyle değiştirir. SignalR
 * yankısı HTTP yanıtından önce gelmiş olabilir; o durumda gerçek mesaj zaten
 * listededir ve baloncuk yalnızca düşer.
 */
function settlePending(
  list: ChatMessage[],
  pendingId: string,
  created: ApiMessage,
): ChatMessage[] {
  const alreadyEchoed = list.some(
    (item) => item.id === created.id && item.pendingId == null,
  );

  return list.flatMap((item) => {
    if (item.pendingId !== pendingId) {
      return [item];
    }
    return alreadyEchoed ? [] : [created];
  });
}

/** scrollTo hedefi içerik sonuna kırpılır; "en dibe in" demenin ucuz yolu. */
const BOTTOM_SCROLL_TARGET = 1_000_000;

type EventChatScreenProps = {
  conversationId?: string;
};

export function EventChatScreen({
  conversationId: directConversationId,
}: EventChatScreenProps = {}) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useSession();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const { t } = useTranslation("messaging");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ApiConversation | null>(
    null,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");

  // Sohbette adaylar üyelerden geliyor, arkadaş listesinden değil: etkinlik
  // grubundakiler arkadaş olmak zorunda değil ve etiketlenmek istenen tam
  // olarak onlar. Üyeler zaten istemcide olduğu için sorgu da gerekmiyor.
  const searchMembers = useCallback(
    async (query: string) => {
      const needle = normalizeSearch(query);
      return (conversation?.members ?? [])
        .filter(
          (member) =>
            member.userId !== user?.id &&
            member.username &&
            (!needle ||
              normalizeSearch(member.username).includes(needle) ||
              normalizeSearch(member.firstName ?? "").includes(needle)),
        )
        .slice(0, 8);
    },
    [conversation?.members, user?.id],
  );

  const mention = useMentionComposer(draft, searchMembers);
  const [isDeleting, setIsDeleting] = useState(false);

  /** Taslağın senkron aynası: aynı karedeki ikinci dokunuş boş görsün. */
  const draftRef = useRef("");
  const scrollRef = useAnimatedRef<ScrollView>();
  /** Yalnızca klavye açılırken dibe sabitle; kapanışta konumu koru. */
  const isKeyboardOpening = useSharedValue(false);
  /** Bir sonraki içerik ölçümünde en alta in (ilk yükleme + kendi mesajım). */
  const stickToBottomRef = useRef(true);
  const didInitialScrollRef = useRef(false);
  /** SignalR callback'i efekt kurulurken kapanır; kimlik ref'ten okunur. */
  const userIdRef = useRef<string | undefined>(user?.id);

  userIdRef.current = user?.id;

  // Klavye açılınca içerik boyutu değişmez, yalnızca görünür alan kısalır, bu
  // yüzden onContentSizeChange tetiklenmez. Klavyenin her animasyon karesinde
  // UI thread'inde dibe kaydırıyoruz: hedef içerik sonuna kırpıldığı için liste
  // alan küçüldükçe dipte kalır ve hareket klavyeyle birebir senkron olur.
  useKeyboardHandler(
    {
      onStart: (event) => {
        "worklet";
        isKeyboardOpening.value = event.height > 0;
      },
      onMove: () => {
        "worklet";
        if (isKeyboardOpening.value) {
          scrollTo(scrollRef, 0, BOTTOM_SCROLL_TARGET, false);
        }
      },
      onEnd: () => {
        "worklet";
        if (isKeyboardOpening.value) {
          scrollTo(scrollRef, 0, BOTTOM_SCROLL_TARGET, false);
        }
      },
    },
    [],
  );

  useEffect(() => {
    if (!id && !directConversationId) {
      return;
    }

    let disposed = false;
    let connection: Awaited<ReturnType<typeof connectEventChat>> = null;

    void (async () => {
      try {
        const resolvedConversationId =
          directConversationId ?? (await getEventConversation(id)).id;
        if (!resolvedConversationId || disposed) {
          return;
        }
        setConversationId(resolvedConversationId);
        const details = await getConversation(resolvedConversationId).catch(
          () => null,
        );
        if (!disposed) {
          setConversation(details);
        }
        const page = await listMessages(resolvedConversationId);
        if (disposed) {
          return;
        }
        // listMessages already returns oldest-to-newest (see the backend's
        // ListMessagesQuery) - reversing again here put messages newest-first,
        // so "the last item" was actually the oldest one, and read-state tracking
        // (below) kept marking that stale message as read instead of the real latest.
        const ordered = page.items;
        stickToBottomRef.current = true;
        setMessages(ordered);

        const latest = ordered[ordered.length - 1];
        if (latest) {
          void markConversationRead(resolvedConversationId, latest.id).catch(
            () => undefined,
          );
        }

        connection = await connectEventChat(
          resolvedConversationId,
          (payload) => {
            const incoming = payload as ApiMessage;
            if (!incoming?.id) {
              return;
            }
            setMessages((prev) => {
              const index = prev.findIndex(
                (item) => item.id === incoming.id && item.pendingId == null,
              );
              if (index !== -1) {
                const next = [...prev];
                next[index] = incoming;
                return next;
              }

              // Kendi mesajımızın yankısı HTTP yanıtından önce gelebilir.
              // İkinci bir baloncuk eklemek yerine bekleyenin yerine geçir.
              if (incoming.senderUserId === userIdRef.current) {
                const pendingIndex = prev.findIndex(
                  (item) =>
                    item.status === "sending" &&
                    (item.content ?? "") === (incoming.content ?? ""),
                );
                if (pendingIndex !== -1) {
                  const next = [...prev];
                  next[pendingIndex] = incoming;
                  return next;
                }
              }

              return [...prev, incoming];
            });
            if (incoming.senderUserId !== userIdRef.current) {
              void markConversationRead(
                resolvedConversationId,
                incoming.id,
              ).catch(() => undefined);
            }
          },
        );
      } catch (error) {
        showToast({
          type: "error",
          title: t("toasts.openFailed"),
          description: getApiErrorMessage(
            error,
            t("toasts.openFailedFallback"),
          ),
        });
      }
    })();

    return () => {
      disposed = true;
      void connection?.stop();
    };
  }, [directConversationId, id, showToast, t]);

  const sorted = useMemo(
    () =>
      [...messages].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [messages],
  );

  const headerTitle = useMemo(() => {
    if (conversation?.type === CONVERSATION_TYPE.direct) {
      const peer = conversation.members?.find(
        (member) => member.userId !== user?.id,
      );
      const name = peer?.firstName || peer?.username || conversation.title;
      return (name || t("header.defaultTitle")).toLocaleUpperCase(
        getCurrentLocale(),
      );
    }

    return conversation?.title || t("header.defaultTitle");
  }, [conversation, t, user?.id]);

  /** Birebir sohbetin karşı tarafı; başlıkta avatarıyla birlikte duruyor. */
  const peer = useMemo(() => {
    if (conversation?.type !== CONVERSATION_TYPE.direct) {
      return null;
    }
    return (
      conversation.members?.find((member) => member.userId !== user?.id) ?? null
    );
  }, [conversation, user?.id]);

  const isClosed =
    conversation?.isClosed === true &&
    conversation.type === CONVERSATION_TYPE.event;

  const { background, chooseBackground } = useChatBackground(
    conversationId,
    conversation?.type === CONVERSATION_TYPE.event,
  );
  const [backgroundSheetOpen, setBackgroundSheetOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [eventImageUrl, setEventImageUrl] = useState<string | null>(null);

  // Sohbet yanıtı etkinliğin görselini taşımıyor, yalnızca kimliğini. Zemin
  // için ayrıca çekiliyor; gelmezse desene düşülür, ekran beklemez.
  useEffect(() => {
    const eventId = conversation?.eventId;
    if (!eventId) {
      return;
    }

    let cancelled = false;
    void getEventById(eventId)
      .then((event) => {
        if (!cancelled && event?.sportCoverImageUrl) {
          setEventImageUrl(resolveMediaUrl(event.sportCoverImageUrl));
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [conversation?.eventId]);

  const markClosed = () => {
    setConversation((current) =>
      current ? { ...current, isClosed: true } : current,
    );
  };

  const dispatchSend = async (targetConversationId: string, text: string) => {
    const pendingId = `pending-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const optimistic: ChatMessage = {
      id: pendingId,
      pendingId,
      mentions: [],
      status: "sending",
      conversationId: targetConversationId,
      senderUserId: user?.id ?? "",
      senderUsername: user?.username ?? null,
      senderFirstName: user?.firstName ?? null,
      senderLastName: user?.lastName ?? null,
      senderProfileImageUrl: user?.avatarUrl ?? null,
      messageType: 0,
      content: text,
      mediaUrl: null,
      mediaSize: null,
      mediaMimeType: null,
      replyToMessageId: null,
      editedAt: null,
      isRedacted: false,
      createdAt: new Date().toISOString(),
    };

    stickToBottomRef.current = true;
    setMessages((prev) => [...prev, optimistic]);

    try {
      const created = await sendTextMessage(
        targetConversationId,
        text,
        mention.mentionedUserIds,
      );
      setMessages((prev) => settlePending(prev, pendingId, created));
    } catch (error) {
      const closed =
        conversation?.type === CONVERSATION_TYPE.event &&
        isApiError(error) &&
        (error.code === "Messaging.ConversationClosed" || error.status === 409);
      if (closed) {
        markClosed();
      }

      setMessages((prev) =>
        prev.map((item) =>
          item.pendingId === pendingId
            ? { ...item, status: "failed" as const }
            : item,
        ),
      );

      showToast({
        type: "error",
        title: closed ? t("toasts.closedTitle") : t("toasts.sendFailed"),
        description: closed
          ? t("toasts.closedDescription")
          : getApiErrorMessage(error),
      });
    }
  };

  const send = () => {
    const text = draftRef.current.trim();
    if (!conversationId || !text || isClosed) {
      return;
    }

    // Taslağı senkron temizliyoruz: baloncuk anında görünür, alan boşalır ve
    // aynı karede gelen ikinci dokunuş gönderecek metin bulamaz.
    draftRef.current = "";
    setDraft("");
    void dispatchSend(conversationId, text);
  };

  const retry = (message: ChatMessage) => {
    const text = message.content?.trim();
    if (!conversationId || !message.pendingId || !text || isClosed) {
      return;
    }

    setMessages((prev) =>
      prev.filter((item) => item.pendingId !== message.pendingId),
    );
    void dispatchSend(conversationId, text);
  };

  const handleContentSizeChange = () => {
    if (!stickToBottomRef.current) {
      return;
    }
    stickToBottomRef.current = false;
    scrollRef.current?.scrollToEnd({ animated: didInitialScrollRef.current });
    didInitialScrollRef.current = true;
  };

  const confirmDelete = () => {
    if (!conversationId || isDeleting) {
      return;
    }

    confirmDestructive({
      title: t("delete.title"),
      message: t("delete.description"),
      confirmLabel: t("delete.confirm"),
      cancelLabel: t("delete.cancel"),
      onConfirm: () => {
        setIsDeleting(true);
        void deleteConversation(conversationId)
          .then(() => {
            showToast({ type: "success", title: t("delete.success") });
            router.back();
          })
          .catch((deleteError) => {
            setIsDeleting(false);
            showToast({
              type: "error",
              title: t("delete.failed"),
              description: getApiErrorMessage(deleteError),
            });
          });
      },
    });
  };

  const canSend = draft.trim().length > 0;

  return (
    <AppScreen
      keyboardAvoiding
      keyboardAwareScroll={false}
      keyboardVerticalOffset={54}
      scrollRef={scrollRef}
      onContentSizeChange={handleContentSizeChange}
      background={
        <ChatBackground variant={background} imageUrl={eventImageUrl} />
      }
      header={
        // Başlık da alt çubuk gibi kendi zeminini taşıyor. Zemin durum
        // çubuğunun altına kadar uzatılıyor: AppScreen üst güvenli alanı
        // kendisi boşluk olarak veriyor, orası boyanmayınca fotoğraf şeridi
        // başlıkla ekranın tepesi arasında kalıyordu.
        <View
          style={{ marginTop: -insets.top, paddingTop: insets.top }}
          className="bg-background-primary/85"
        >
          <ScreenHeader
            title={headerTitle}
            // Etkinlik sohbetinde başlık etkinliğin kendisine götürür: kullanıcı
            // sohbetteyken "bu hangi etkinlikti" diye geri gidip aramak zorunda
            // kalmasın.
            onTitlePress={
              conversation?.eventId
                ? () => router.push(`/events/${conversation.eventId}`)
                : peer
                  ? () => router.push(`/users/${peer.userId}`)
                  : undefined
            }
            // Birebir sohbette ad yerine kullanıcı adı ve solunda fotoğrafı:
            // kullanıcılar birbirini uygulamada kullanıcı adıyla tanıyor,
            // ayrıca iki farklı "Ceren" ayırt edilemiyordu.
            titleContent={
              peer ? (
                <View className="flex-row items-center gap-4 px-6">
                  <Avatar
                    uri={peer.profileImageUrl}
                    name={peer.firstName ?? peer.username}
                    size={28}
                    borderWidth={0}
                  />
                  <Text
                    numberOfLines={1}
                    className="shrink font-body-bold text-body-sm text-text-primary"
                  >
                    {displayHandle(peer.username)}
                  </Text>
                </View>
              ) : undefined
            }
            showBack
            right={
              // Tek düğme: başlık satırında iki ikon hem yer kaplıyor hem
              // uzun etkinlik adlarını sıkıştırıyordu.
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("menu.a11y")}
                hitSlop={HIT_SLOP}
                onPress={() => setMenuOpen(true)}
                className="h-10 w-10 items-center justify-center rounded-full border border-border-default bg-surface-primary active:opacity-70"
              >
                <FontAwesome6
                  name="ellipsis"
                  size={15}
                  color={themeColors.text.secondary}
                />
              </Pressable>
            }
          />
        </View>
      }
      contentClassName="gap-3 px-6 pt-2"
      footer={
        isClosed ? (
          <View className="border-t border-border-default bg-background-primary/95 px-6 py-4">
            <Text className="text-center font-body text-body-sm leading-5 text-text-tertiary">
              {t("chat.closedFooter")}
            </Text>
          </View>
        ) : (
          // Yazma alanı kendi zeminini taşıyor: fotoğraflı sohbette şeffaf bir
          // çubuk, altındaki açık bölgede kayboluyordu.
          <View className="border-t border-border-default bg-background-primary/95">
            {mention.isPicking && mention.suggestions.length > 0 ? (
              <View className="gap-1 border-b border-border-default px-4 py-2">
                {mention.suggestions.map((member) => (
                  <Pressable
                    key={member.userId}
                    onPress={() => {
                      const next = mention.apply(member);
                      if (next !== null) {
                        draftRef.current = next;
                        setDraft(next);
                      }
                    }}
                    className="flex-row items-center gap-3 rounded-2xl px-2 py-2 active:opacity-70"
                  >
                    <Avatar
                      uri={member.profileImageUrl}
                      name={member.firstName}
                      size={28}
                    />
                    <Text className="flex-1 font-body-bold text-body-sm text-text-primary">
                      @{member.username}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <View
              style={{
                paddingBottom:
                  keyboardHeight > 0 ? 8 : Math.max(insets.bottom, 10),
              }}
              className="flex-row items-end gap-2 px-5 pt-4"
            >
              <AppTextInput
                value={draft}
                onChangeText={(value) => {
                  draftRef.current = value;
                  setDraft(value);
                }}
                onSelectionChange={(event) =>
                  mention.onSelectionChange(event.nativeEvent.selection.start)
                }
                placeholder={t("chat.placeholder")}
                placeholderTextColor={themeColors.placeholder}
                textAlignVertical="top"
                hitSlop={HIT_SLOP}
                multiline
                style={{
                  minHeight: 40,
                  maxHeight: 110,
                  lineHeight: 19,
                  paddingTop: 10,
                  paddingBottom: 10,
                }}
                className="min-w-0 flex-1 rounded-full border border-border-strong bg-surface-primary px-4 font-body text-body-sm text-text-primary"
              />
              {/* Yalnızca ikon: alt çubuk sohbetin değil mesajın önünde
                  durmasın. Etiket erişilebilirlik adında kalıyor. */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("chat.send")}
                accessibilityState={{ disabled: !canSend }}
                onPress={send}
                disabled={!canSend}
                hitSlop={HIT_SLOP}
                className={`h-10 w-10 shrink-0 items-center justify-center rounded-full active:opacity-75 ${
                  canSend ? "bg-brand-primary" : "bg-surface-secondary"
                }`}
              >
                <FontAwesome6
                  name="paper-plane"
                  size={15}
                  color={
                    canSend
                      ? themeColors.background.primary
                      : themeColors.text.tertiary
                  }
                />
              </Pressable>
            </View>
          </View>
        )
      }
    >
      {sorted.length === 0 ? (
        <EmptyState
          variant="inline"
          message={isClosed ? t("chat.emptyClosed") : t("chat.emptyOpen")}
          className="py-10"
        />
      ) : (
        sorted.map((message, index) => {
          const mine = message.senderUserId === user?.id;
          const previous = sorted[index - 1];
          const showSender =
            !previous || previous.senderUserId !== message.senderUserId;

          return (
            <MessageRow
              key={message.id}
              message={message}
              mine={mine}
              showSender={showSender}
              onOpenSender={(userId) => router.push(`/users/${userId}`)}
              onRetry={() => retry(message)}
            />
          );
        })
      )}
      <BottomSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={t("menu.title")}
        subtitle={headerTitle}
      >
        <View className="gap-2">
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setMenuOpen(false);
              setBackgroundSheetOpen(true);
            }}
            className="flex-row items-center gap-3 rounded-2xl border border-border-default bg-surface-primary px-4 py-4 active:bg-surface-secondary"
          >
            <FontAwesome6
              name="palette"
              size={16}
              color={themeColors.text.secondary}
            />
            <Text className="flex-1 font-body text-body text-text-primary">
              {t("background.title")}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !conversationId || isDeleting }}
            disabled={!conversationId || isDeleting}
            onPress={() => {
              setMenuOpen(false);
              confirmDelete();
            }}
            className="flex-row items-center gap-3 rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-4 active:opacity-70"
          >
            <FontAwesome6
              name="trash-can"
              size={16}
              color={themeColors.destructive}
            />
            <Text className="flex-1 font-body text-body text-destructive">
              {t("delete.confirm")}
            </Text>
          </Pressable>
        </View>
      </BottomSheet>

      <ChatBackgroundSheet
        visible={backgroundSheetOpen}
        onClose={() => setBackgroundSheetOpen(false)}
        selected={background}
        onSelect={chooseBackground}
        eventImageUrl={eventImageUrl}
      />
    </AppScreen>
  );
}
