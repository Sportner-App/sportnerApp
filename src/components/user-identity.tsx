import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { Avatar } from "./avatar";

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
  const label = normalizedUsername ? `@${normalizedUsername}` : "Sporcu";
  const content = (
    <>
      <Avatar
        uri={avatarUrl}
        name={normalizedUsername || fallbackName || "Sporcu"}
        size={avatarSize}
        borderWidth={0}
      />
      <View className="min-w-0 flex-1">
        <Text
          numberOfLines={1}
          className="font-body-bold text-sm text-text-primary"
        >
          {label}
        </Text>
        {meta ? (
          <Text
            numberOfLines={1}
            className="mt-0.5 font-body text-[11px] text-text-secondary"
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
