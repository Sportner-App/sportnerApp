import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { resolveMediaUrl } from "@/utils/media-url";

type ProfileIntroVideoProps = {
  uri: string;
};

export function ProfileIntroVideo({ uri }: ProfileIntroVideoProps) {
  const source = resolveMediaUrl(uri);
  const player = useVideoPlayer(source, (instance) => {
    instance.loop = true;
  });
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const subscription = player.addListener("playingChange", (event) => {
      setIsPlaying(event.isPlaying);
    });

    return () => {
      subscription.remove();
      player.pause();
    };
  }, [player]);

  return (
    <View className="gap-2">
      <Text className="font-body text-xs font-semibold tracking-wide text-brand-neutral">
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
        className="overflow-hidden rounded-3xl border border-white/10 bg-brand-raised"
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
              <FontAwesome6 name="play" size={18} color="#0f172a" />
            </View>
          </View>
        )}
      </Pressable>
    </View>
  );
}
