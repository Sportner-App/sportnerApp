import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useIsFocused } from "@react-navigation/native";
import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";

import { resolveMediaUrl } from "@/utils/media-url";

type ProfileIntroVideoProps = {
  uri: string;
};

export function ProfileIntroVideo({ uri }: ProfileIntroVideoProps) {
  const isFocused = useIsFocused();
  const source = resolveMediaUrl(uri);
  const player = useVideoPlayer(source, (instance) => {
    instance.loop = true;
  });
  const { isPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });

  useEffect(() => {
    if (!isFocused && player.playing) {
      player.pause();
    }
  }, [isFocused, player]);

  return (
    <View className="gap-2.5">
      <Text className="font-body text-[10px] font-semibold tracking-[1.5px] text-text-tertiary">
        TANITIM VİDEOSU
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          isPlaying ? "Videoyu duraklat" : "Tanıtım videosunu oynat"
        }
        onPress={() => {
          if (isPlaying) {
            player.pause();
            return;
          }
          void player.play();
        }}
        className="overflow-hidden rounded-[24px] border border-border-default bg-surface-primary"
      >
        <VideoView
          player={player}
          style={{ width: "100%", aspectRatio: 16 / 9 }}
          contentFit="cover"
          nativeControls={false}
        />
        {isPlaying ? null : (
          <View
            pointerEvents="none"
            className="absolute inset-0 items-center justify-center bg-black/30"
          >
            <View className="h-14 w-14 items-center justify-center rounded-full bg-brand-primary">
              <FontAwesome6 name="play" size={18} color="#06111a" />
            </View>
          </View>
        )}
      </Pressable>
    </View>
  );
}
