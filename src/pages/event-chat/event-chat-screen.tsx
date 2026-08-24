import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { AppScreen, ScreenHeader } from "@/components";
import { useSession, useToast } from "@/contexts";
import { getApiErrorMessage } from "@/lib/api/errors";
import { connectEventChat } from "@/lib/signalr";
import {
  getEventConversation,
  listMessages,
  sendTextMessage,
} from "@/services/messaging-service";
import type { ApiMessage } from "@/types/messaging";

import { MessageRow } from "./message-row";

export function EventChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useSession();
  const { showToast } = useToast();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!id) {
      return;
    }

    let disposed = false;
    let connection: Awaited<ReturnType<typeof connectEventChat>> = null;

    void (async () => {
      try {
        const conversation = await getEventConversation(id);
        if (!conversation?.id || disposed) {
          return;
        }
        setConversationId(conversation.id);
        const page = await listMessages(conversation.id);
        if (disposed) {
          return;
        }
        setMessages([...page.items].reverse());

        connection = await connectEventChat(conversation.id, (payload) => {
          const incoming = payload as ApiMessage;
          if (!incoming?.id) {
            return;
          }
          setMessages((prev) =>
            prev.some((item) => item.id === incoming.id)
              ? prev
              : [...prev, incoming],
          );
        });
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
  }, [id, showToast]);

  const sorted = useMemo(
    () =>
      [...messages].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [messages],
  );

  const send = async () => {
    const text = draft.trim();
    if (!conversationId || !text || sending) {
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
      showToast({
        type: "error",
        title: "Gönderilemedi",
        description: getApiErrorMessage(error),
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <AppScreen
      keyboardAvoiding
      header={<ScreenHeader title="SOHBET" showBack />}
      contentClassName="gap-3 px-6 pt-2"
      footer={
        <View className="flex-row items-center gap-2 border-t border-white/10 px-6 py-3">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Mesaj yaz…"
            placeholderTextColor="#64748b"
            className="flex-1 rounded-2xl border border-white/10 bg-brand-surface/90 px-4 py-3 font-body text-white"
          />
          <Pressable
            onPress={send}
            disabled={sending}
            className="rounded-2xl bg-brand-primary px-4 py-3"
          >
            <Text className="font-body font-semibold text-brand-secondary">
              Gönder
            </Text>
          </Pressable>
        </View>
      }
    >
      {sorted.length === 0 ? (
        <Text className="py-10 text-center font-body text-sm text-brand-neutral">
          İlk mesajı sen yaz.
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
