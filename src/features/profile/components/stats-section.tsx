import { useRouter } from "expo-router";
import { Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useStatItems } from "@/features/profile/copy";
import type { ProfileStatistics } from "@/features/profile/types";
import { AppText as Text } from "@/components";

type StatsSectionProps = {
  statistics: ProfileStatistics | null;
  /**
   * Yalnızca kendi profilinde tıklanabilir. Hedefler "benim etkinliklerim" ve
   * "benim arkadaşlarım" olduğu için başkasının profilinde dokunmak kullanıcıyı
   * baktığı kişininkine değil kendi listesine götürürdü.
   */
  interactive?: boolean;
};

/**
 * Sayılar tıklanabilir: kullanıcılar bu kutuları zaten bağlantı sanıp
 * dokunuyordu, hiçbir şey olmayınca uygulamanın takıldığını düşünüyorlardı.
 */
export function StatsSection({
  statistics,
  interactive = false,
}: StatsSectionProps) {
  const router = useRouter();
  const statItems = useStatItems();

  if (!statistics) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(380).delay(60)}
      className="flex-row rounded-[22px] border border-border-default bg-background-secondary/70 py-3.5"
    >
      {statItems.map((item, index) => {
        const href = interactive ? item.href : undefined;

        return (
          <Pressable
            key={item.key}
            accessibilityRole={href ? "button" : undefined}
            accessibilityLabel={`${statistics[item.field]} ${item.label}`}
            disabled={!href}
            onPress={href ? () => router.push(href as never) : undefined}
            className={`flex-1 items-center px-1 active:opacity-60 ${
              index > 0 ? "border-l border-border-default" : ""
            }`}
          >
            <Text className="font-body-bold text-heading-sm text-text-primary">
              {statistics[item.field]}
            </Text>
            <Text className="mt-1 font-body text-overline text-text-tertiary">
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </Animated.View>
  );
}
