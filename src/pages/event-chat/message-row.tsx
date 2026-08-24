import { Image, Pressable, Text, View } from "react-native";

import type { ApiMessage } from "@/types/messaging";
import { formatPersonName } from "@/utils/events";

type MessageRowProps = {
  message: ApiMessage;
  mine: boolean;
  showSender: boolean;
  onOpenSender?: (userId: string) => void;
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

function SenderAvatar({
  name,
  uri,
  onPress,
}: {
  name: string;
  uri: string | null;
  onPress?: () => void;
}) {
  const initial = name.trim()[0]?.toUpperCase() || "?";
  const body = uri ? (
    <View className="h-9 w-9 overflow-hidden rounded-full">
      <Image source={{ uri }} className="h-9 w-9" />
    </View>
  ) : (
    <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-primary/15">
      <Text className="font-body text-xs font-semibold text-brand-primary">
        {initial}
      </Text>
    </View>
  );

  if (!onPress) {
    return body;
  }

  return <Pressable onPress={onPress}>{body}</Pressable>;
}

export function MessageRow({
  message,
  mine,
  showSender,
  onOpenSender,
}: MessageRowProps) {
  const senderName = formatPersonName({
    firstName: message.senderFirstName,
    lastName: message.senderLastName,
    username: message.senderUsername,
  });
  const name = mine ? "Sen" : senderName;

  const body = message.isRedacted
    ? "Mesaj silindi"
    : message.content || (message.mediaUrl ? "Medya" : "");

  const avatar = showSender ? (
    <SenderAvatar
      name={senderName}
      uri={message.senderProfileImageUrl}
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
        >
          <Text className="font-body text-sm text-white">{body}</Text>
        </View>
        <Text className="mt-1 font-mono text-[10px] text-brand-neutral">
          {formatMessageTime(message.createdAt)}
        </Text>
      </View>
      {mine ? avatar : null}
    </View>
  );
}
