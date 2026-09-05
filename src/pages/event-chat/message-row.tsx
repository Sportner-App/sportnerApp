import { Pressable, Text, View } from "react-native";

import { Avatar } from "@/components";
import type { ChatMessage } from "@/types/messaging";

type MessageRowProps = {
  message: ChatMessage;
  mine: boolean;
  showSender: boolean;
  onOpenSender?: (userId: string) => void;
  /** Gönderilemeyen kendi mesajını yeniden dener. */
  onRetry?: () => void;
};

function formatMessageTime(iso: string) {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageRow({
  message,
  mine,
  showSender,
  onOpenSender,
  onRetry,
}: MessageRowProps) {
  const isPending = mine && message.status === "sending";
  const isFailed = mine && message.status === "failed";
  const senderName =
    message.senderUsername || message.senderFirstName || "Sporcu";
  const name = mine ? "Sen" : `@${message.senderUsername || "sporcu"}`;

  const body = message.isRedacted
    ? "Mesaj silindi"
    : message.content || (message.mediaUrl ? "Medya" : "");

  const avatar = showSender ? (
    <Avatar
      name={senderName}
      uri={message.senderProfileImageUrl}
      size={36}
      borderWidth={0}
      onPress={
        mine || !onOpenSender
          ? undefined
          : () => onOpenSender(message.senderUserId)
      }
    />
  ) : (
    <View className="w-9" />
  );

  return (
    <View
      className={`max-w-[90%] flex-row items-end gap-2 ${
        mine ? "self-end" : "self-start"
      }`}
    >
      {mine ? null : avatar}
      <View className={mine ? "items-end" : "items-start"}>
        {showSender ? (
          <Text className="mb-1 font-body text-xs font-semibold text-brand-primary">
            {name}
          </Text>
        ) : null}
        <View
          className={`rounded-2xl px-3 py-2 ${
            mine ? "bg-brand-primary/20" : "bg-brand-surface"
          }`}
          style={isPending ? { opacity: 0.55 } : undefined}
        >
          <Text className="font-body text-sm text-white">{body}</Text>
        </View>
        {isFailed ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mesajı yeniden gönder"
            onPress={onRetry}
            hitSlop={8}
            className="mt-1 active:opacity-70"
          >
            <Text className="font-mono text-[10px] text-destructive">
              Gönderilemedi · Tekrar dene
            </Text>
          </Pressable>
        ) : (
          <Text className="mt-1 font-mono text-[10px] text-brand-neutral">
            {isPending ? "Gönderiliyor…" : formatMessageTime(message.createdAt)}
          </Text>
        )}
      </View>
      {mine ? avatar : null}
    </View>
  );
}
