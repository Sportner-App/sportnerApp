import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { AppScreen, ScreenHeader } from "@/components";
import { useSession, useToast } from "@/contexts";
import { getApiErrorMessage, isApiError } from "@/lib/api/errors";
import { connectEventChat } from "@/lib/signalr";
import {
  getConversation,
  getEventConversation,
  listMessages,
  markConversationRead,
  sendTextMessage,
} from "@/services/messaging-service";
import {
  CONVERSATION_TYPE,
  type ApiConversation,
  type ApiMessage,
  type ChatMessage,
} from "@/types/messaging";

import { MessageRow } from "./message-row";

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
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ApiConversation | null>(
    null,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");

  /** Taslağın senkron aynası: aynı karedeki ikinci dokunuş boş görsün. */
  const draftRef = useRef("");
  const scrollRef = useRef<ScrollView>(null);
  /** Bir sonraki içerik ölçümünde en alta in (ilk yükleme + kendi mesajım). */
  const stickToBottomRef = useRef(true);
  const didInitialScrollRef = useRef(false);
  /** SignalR callback'i efekt kurulurken kapanır; kimlik ref'ten okunur. */
  const userIdRef = useRef<string | undefined>(user?.id);

  userIdRef.current = user?.id;

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
        const ordered = [...page.items].reverse();
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
          title: "Sohbet açılamadı",
          description: getApiErrorMessage(error, "Henüz sohbet yok."),
        });
      }
    })();

    return () => {
      disposed = true;
      void connection?.stop();
    };
  }, [directConversationId, id, showToast]);

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
      return (name || "SOHBET").toLocaleUpperCase("tr-TR");
    }

    return conversation?.title || "SOHBET";
  }, [conversation, user?.id]);

  const isClosed =
    conversation?.isClosed === true &&
    conversation.type === CONVERSATION_TYPE.event;

  const markClosed = () => {
    setConversation((current) =>
      current ? { ...current, isClosed: true } : current,
    );
  };

  const dispatchSend = async (
    targetConversationId: string,
    text: string,
  ) => {
    const pendingId = `pending-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const optimistic: ChatMessage = {
      id: pendingId,
      pendingId,
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
      const created = await sendTextMessage(targetConversationId, text);
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
        title: closed ? "Sohbet kapandı" : "Gönderilemedi",
        description: closed
          ? "Etkinlik bittiği için artık mesaj gönderilemez."
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

  const canSend = draft.trim().length > 0;

  return (
    <AppScreen
      keyboardAvoiding
      scrollRef={scrollRef}
      onContentSizeChange={handleContentSizeChange}
      header={<ScreenHeader title={headerTitle} showBack />}
      contentClassName="gap-3 px-6 pt-2"
      footer={
        isClosed ? (
          <View className="border-t border-border-default px-6 py-4">
            <Text className="text-center font-body text-sm leading-5 text-brand-neutral">
              Etkinlik bitti. Sohbet kapandı, geçmişi okuyabilirsin.
            </Text>
          </View>
        ) : (
          <View className="flex-row items-center gap-2 border-t border-border-default px-6 py-3">
            <TextInput
              value={draft}
              onChangeText={(value) => {
                draftRef.current = value;
                setDraft(value);
              }}
              placeholder="Mesaj yaz…"
              placeholderTextColor="#64748b"
              textAlignVertical="center"
              hitSlop={8}
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={send}
              style={{
                height: 48,
                lineHeight: 20,
                paddingTop: 0,
                paddingBottom: 0,
              }}
              className="flex-1 rounded-2xl border border-border-default bg-surface-primary px-4 font-body text-base text-text-primary"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSend }}
              onPress={send}
              disabled={!canSend}
              className={`h-12 items-center justify-center rounded-2xl px-5 active:opacity-75 ${
                canSend ? "bg-brand-primary" : "bg-brand-primary/35"
              }`}
            >
              <Text className="font-body font-semibold text-brand-secondary">
                Gönder
              </Text>
            </Pressable>
          </View>
        )
      }
    >
      {sorted.length === 0 ? (
        <Text className="py-10 text-center font-body text-sm text-brand-neutral">
          {isClosed
            ? "Bu etkinlik sohbetinde mesaj yok."
            : "İlk mesajı sen yaz."}
        </Text>
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
    </AppScreen>
  );
}
