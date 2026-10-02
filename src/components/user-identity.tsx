import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Avatar } from "./avatar";
import { AppText as Text } from "@/components/app-text";

type UserIdentityProps = {
  username?: string | null;
  avatarUrl?: string | null;
  fallbackName?: string | null;
  meta?: string | null;
  avatarSize?: number;
  onPress?: () => void;
  trailing?: ReactNode;
};

/** Liste ve kartlarda kullanıcı kimliğini daima avatar + @username olarak sunar. */
export function UserIdentity({
  username,
  avatarUrl,
  fallbackName,
  meta,
  avatarSize = 44,
  onPress,
  trailing,
}: UserIdentityProps) {
  const normalizedUsername = username?.trim();
  const { t } = useTranslation("events");
  const athlete = t("fallback.athlete");
  const label = normalizedUsername ? `@${normalizedUsername}` : athlete;
  const content = (
    <>
      <Avatar
        uri={avatarUrl}
        name={fallbackName?.trim() || normalizedUsername || athlete}
        size={avatarSize}
        borderWidth={0}
      />
      <View className="min-w-0 flex-1">
        <Text
          numberOfLines={1}
          className="font-body-bold text-body-sm text-text-primary"
        >
          {label}
        </Text>
        {meta ? (
          <Text
            numberOfLines={1}
            className="mt-0.5 font-body text-overline text-text-secondary"
          >
            {meta}
          </Text>
        ) : null}
      </View>
      {trailing}
    </>
  );

  return onPress ? (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 active:opacity-70"
    >
      {content}
    </Pressable>
  ) : (
    <View className="flex-row items-center gap-3">{content}</View>
  );
}
