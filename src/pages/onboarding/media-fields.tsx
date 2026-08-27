import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, Text, View } from "react-native";

import { Avatar } from "@/components";
import type { PickedMedia } from "@/utils/media-picker";

type MediaFieldsProps = {
  avatar: PickedMedia | null;
  video?: PickedMedia | null;
  onPickAvatar: () => void;
  onPickVideo?: () => void;
  onClearAvatar?: () => void;
  onClearVideo?: () => void;
  showVideo?: boolean;
};

export function MediaFields({
  avatar,
  video,
  onPickAvatar,
  onPickVideo,
  onClearAvatar,
  onClearVideo,
  showVideo = true,
}: MediaFieldsProps) {
  return (
    <View className="gap-4">
      <View className="items-center gap-2">
        <Avatar
          uri={avatar?.uri}
          name="Profil"
          size={96}
          fallbackIcon="camera"
          borderColor="rgba(204,255,0,0.3)"
          onPress={onPickAvatar}
          accessibilityLabel="Profil fotoğrafı seç"
        />
        <Pressable onPress={onPickAvatar} hitSlop={8}>
          <Text className="font-body text-xs text-brand-primary">
            {avatar ? "Fotoğrafı değiştir" : "Profil fotoğrafı ekle"}
          </Text>
        </Pressable>
        {avatar && onClearAvatar ? (
          <Pressable onPress={onClearAvatar} hitSlop={8}>
            <Text className="font-body text-xs text-brand-neutral">Kaldır</Text>
          </Pressable>
        ) : null}
      </View>

      {showVideo ? (
        <Pressable
          onPress={onPickVideo}
          className="flex-row items-center gap-3 rounded-2xl border border-white/10 bg-background-primary/70 px-4 py-3.5 active:opacity-80"
        >
          <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-primary/15">
            <FontAwesome6 name="video" size={14} color="#ccff00" />
          </View>
          <View className="flex-1">
            <Text className="font-body text-sm font-semibold text-white">
              Tanıtım videosu
            </Text>
            <Text
              className="font-body text-xs text-brand-neutral"
              numberOfLines={1}
            >
              {video ? video.name : "Opsiyonel · en fazla 30 sn"}
            </Text>
          </View>
          {video && onClearVideo ? (
            <Pressable onPress={onClearVideo} hitSlop={8}>
              <Text className="font-body text-xs text-brand-neutral">
                Kaldır
              </Text>
            </Pressable>
          ) : (
            <FontAwesome6 name="plus" size={12} color="#64748b" />
          )}
        </Pressable>
      ) : null}
    </View>
  );
}
