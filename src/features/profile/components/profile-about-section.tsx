import Animated, { FadeInDown } from "react-native-reanimated";

import { AppText as Text } from "@/components";

type ProfileAboutSectionProps = {
  bio: string | null;
};

/** Profil açıklaması; boşsa hiç yer kaplamıyor. */
export function ProfileAboutSection({ bio }: ProfileAboutSectionProps) {
  const text = bio?.trim();
  if (!text) {
    return null;
  }

  return (
    <Animated.View entering={FadeInDown.duration(320)} className="-mt-2 px-1">
      <Text className="font-body text-body-sm leading-5 text-text-secondary">
        {text}
      </Text>
    </Animated.View>
  );
}
