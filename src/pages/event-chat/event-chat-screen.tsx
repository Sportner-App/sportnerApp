import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

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
} from "@/types/messaging";

import { MessageRow } from "./message-row";

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
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

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
                (item) => item.id === incoming.id,
              );
              if (index === -1) {
                return [...prev, incoming];
              }
              const next = [...prev];
              next[index] = incoming;
              return next;
            });
            if (incoming.senderUserId !== user?.id) {
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

  const send = async () => {
    const text = draft.trim();
    if (!conversationId || !text || sending || isClosed) {
      return;
    }
    setSending(true);
    try {
      const created = await sendTextMessage(conversationId, text);
      setMessages((prev) =>
        prev.some((item) => item.id === created.id) ? prev : [...prev, created],
      );
      setDraft("");
    } catch (error) {
      const closed =
        conversation?.type === CONVERSATION_TYPE.event &&
        isApiError(error) &&
        (error.code === "Messaging.ConversationClosed" || error.status === 409);
      if (closed) {
        markClosed();
      }
      showToast({
        type: "error",
        title: closed ? "Sohbet kapandı" : "Gönderilemedi",
        description: closed
          ? "Etkinlik bittiği için artık mesaj gönderilemez."
          : getApiErrorMessage(error),
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <AppScreen
      keyboardAvoiding
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
              onChangeText={setDraft}
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
              onPress={send}
              disabled={sending}
              className="h-12 items-center justify-center rounded-2xl bg-brand-primary px-5"
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
            />
          );
        })
      )}
    </AppScreen>
  );
}
