import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Avatar } from "@/components";
import type { ChatMessage } from "@/types/messaging";
import { formatMessageTime } from "@/utils/messaging-time";
import { AppText as Text } from "@/components/app-text";

type MessageRowProps = {
  message: ChatMessage;
  mine: boolean;
  showSender: boolean;
  onOpenSender?: (userId: string) => void;
  /** Gönderilemeyen kendi mesajını yeniden dener. */
  onRetry?: () => void;
};

export function MessageRow({
  message,
  mine,
  showSender,
  onOpenSender,
  onRetry,
}: MessageRowProps) {
  const { t } = useTranslation(["messaging", "events"]);
  const isPending = mine && message.status === "sending";
  const isFailed = mine && message.status === "failed";
  const senderName =
    [message.senderFirstName, message.senderLastName]
      .filter(Boolean)
      .join(" ") ||
    message.senderUsername ||
    t("events:fallback.athlete");
  const name = mine
    ? t("messaging:message.you")
    : `@${message.senderUsername || t("events:fallback.athleteHandle")}`;

  const body = message.isRedacted
    ? t("messaging:message.deleted")
    : message.content || (message.mediaUrl ? t("messaging:message.media") : "");

  const avatar = showSender ? (
    <View className="mt-5">
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
    </View>
  ) : (
    <View className="w-9" />
  );

  return (
    <View
      className={`max-w-[90%] flex-row items-start gap-2 ${
        mine ? "self-end" : "self-start"
      }`}
    >
      {mine ? null : avatar}
      <View className={mine ? "items-end" : "items-start"}>
        {showSender ? (
          <Text className="mb-1 font-body text-caption font-semibold text-brand-primary">
            {name}
          </Text>
        ) : null}
        <View
          className={`rounded-2xl px-3 py-2 ${
            mine ? "bg-brand-primary/20" : "bg-brand-surface"
          }`}
          style={isPending ? { opacity: 0.55 } : undefined}
        >
          <Text className="font-body text-body-sm text-white">{body}</Text>
        </View>
        {isFailed ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("messaging:message.retryA11y")}
            onPress={onRetry}
            hitSlop={8}
            className="mt-1 active:opacity-70"
          >
            <Text className="font-mono text-overline text-destructive">
              {t("messaging:message.failed")}
            </Text>
          </Pressable>
        ) : (
          <Text className="mt-1 font-mono text-overline text-brand-neutral">
            {isPending
              ? t("messaging:message.sending")
              : formatMessageTime(message.createdAt)}
          </Text>
        )}
      </View>
      {mine ? avatar : null}
    </View>
  );
}
