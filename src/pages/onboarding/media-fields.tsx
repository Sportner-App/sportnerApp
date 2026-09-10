import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Avatar } from "@/components";
import type { PickedMedia } from "@/utils/media-picker";

type MediaFieldsProps = {
  avatar: PickedMedia | null;
  existingAvatarUrl?: string | null;
  onPickAvatar: () => void;
  onClearAvatar?: () => void;
};

export function MediaFields({
  avatar,
  existingAvatarUrl,
  onPickAvatar,
  onClearAvatar,
}: MediaFieldsProps) {
  const { t } = useTranslation("onboarding");
  const avatarUri = avatar?.uri ?? existingAvatarUrl;
  const hasExistingAvatar = Boolean(existingAvatarUrl && !avatar);

  return (
    <View className="gap-4">
      <View className="items-center gap-2">
        <Avatar
          uri={avatarUri}
          name={t("media.avatarName")}
          size={96}
          fallbackIcon="camera"
          borderColor="rgba(204,255,0,0.3)"
          previewable={false}
          onPress={onPickAvatar}
          accessibilityLabel={t("media.selectPhotoAccessibility")}
        />
        <Pressable onPress={onPickAvatar} hitSlop={8}>
          <Text className="font-body text-xs text-brand-primary">
            {avatarUri ? t("media.changePhoto") : t("media.addPhotoRequired")}
          </Text>
        </Pressable>
        {hasExistingAvatar ? (
          <Text className="text-center font-body text-xs text-brand-neutral">
            {t("media.googlePhotoReady")}
          </Text>
        ) : null}
        {avatar && onClearAvatar ? (
          <Pressable onPress={onClearAvatar} hitSlop={8}>
            <Text className="font-body text-xs text-brand-neutral">
              {existingAvatarUrl
                ? t("media.revertToGoogle")
                : t("media.remove")}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
