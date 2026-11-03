import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { Pressable } from "react-native";

import { AppText as Text } from "@/components";
import { HIT_SLOP, themeColors } from "@/constants/theme";
import type { ApiPostEvent } from "@/features/feed/types";
import { sportIconForSlug } from "@/features/sports/sports";

type PostEventTagProps = {
  event: ApiPostEvent;
  className?: string;
};

/**
 * Gönderinin paylaşıldığı etkinlik ("Halı Saha Maçı'nda"). Dokununca etkinliğe
 * gidiyor; akıştaki fotoğrafı gören kişi aynı ekipten bir sonraki maça
 * buradan ulaşabilsin diye.
 */
export function PostEventTag({ event, className }: PostEventTagProps) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="link"
      hitSlop={HIT_SLOP}
      onPress={() => router.push(`/events/${event.id}`)}
      className={`flex-row items-center gap-1.5 self-start rounded-pill bg-brand-primary/15 px-2.5 py-1 active:opacity-70 ${className ?? ""}`}
    >
      <FontAwesome6
        name={sportIconForSlug(event.sportSlug)}
        size={11}
        color={themeColors.brand.primary}
      />
      <Text
        numberOfLines={1}
        className="shrink font-body-bold text-caption text-brand-primary"
      >
        {event.title}
      </Text>
    </Pressable>
  );
}
