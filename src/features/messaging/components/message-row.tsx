import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";

import { MentionText } from "@/features/feed/components/mention-text";

import { AppText as Text, Avatar } from "@/components";
import type { ChatMessage } from "@/features/messaging/types";
import { formatFullName, formatHandle } from "@/utils/person";
import { formatClockTime } from "@/utils/date-format";
import { HIT_SLOP } from "@/constants/theme";

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
    formatFullName(message.senderFirstName, message.senderLastName) ||
    message.senderUsername ||
    t("events:fallback.athlete");
  const name = mine
    ? t("messaging:message.you")
    : formatHandle(message.senderUsername);

  const body = message.isRedacted
    ? t("messaging:message.deleted")
    : message.content || (message.mediaUrl ? t("messaging:message.media") : "");

  // shrink-0: satır max-w'ye dayandığında daralması gereken metin sütunu,
  // avatar değil. Aksi halde avatar ezilir ya da dışarı taşar.
  const avatar = showSender ? (
    <View className="mt-5 shrink-0">
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
    <View className="w-9 shrink-0" />
  );

  return (
    <View
      className={`max-w-[90%] flex-row items-start gap-2 ${
        mine ? "self-end" : "self-start"
      }`}
    >
      {mine ? null : avatar}
      {/* React Native'de flexShrink varsayılanı 0 — bu sütun daralmayınca
          kendi içerik genişliğini alıyor, satır max-w'yi aşıyor ve avatar
          ekranın sağ kenarından taşıp yarısı kesiliyordu. */}
      <View className={`min-w-0 shrink ${mine ? "items-end" : "items-start"}`}>
        {showSender ? (
          <Text className="mb-1 font-body-bold text-caption text-brand-primary">
            {name}
          </Text>
        ) : null}
        <View
          className={`rounded-2xl px-3 py-2 ${
            mine ? "bg-brand-primary/20" : "bg-surface-primary"
          }`}
          style={isPending ? { opacity: 0.55 } : undefined}
        >
          {/* Silinmiş ya da medya mesajında etiket çözümlemeye gerek yok:
              body o durumda sabit bir metin. */}
          {message.isRedacted || !message.content ? (
            <Text className="font-body text-body-sm text-white">{body}</Text>
          ) : (
            <MentionText
              content={body}
              mentions={message.mentions}
              className="font-body text-body-sm text-white"
            />
          )}
        </View>
        {isFailed ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("messaging:message.retryA11y")}
            onPress={onRetry}
            hitSlop={HIT_SLOP}
            className="mt-1 active:opacity-70"
          >
            <Text className="font-body-bold text-overline text-destructive">
              {t("messaging:message.failed")}
            </Text>
          </Pressable>
        ) : (
          <Text className="mt-1 font-body-bold text-overline text-text-tertiary">
            {isPending
              ? t("messaging:message.sending")
              : formatClockTime(message.createdAt)}
          </Text>
        )}
      </View>
      {mine ? avatar : null}
    </View>
  );
}
