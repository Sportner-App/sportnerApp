import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Button } from "@/components";

type HeroProps = {
  name: string;
  onCreatePress: () => void;
};

export function Hero({ name, onCreatePress }: HeroProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(500).delay(80)}
      className="relative overflow-hidden rounded-[28px] border border-white/10 bg-brand-surface/90 p-5"
    >
      {/* Dekoratif köşe parlaması */}
      <View className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand-primary/10" />
      <View className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-brand-primary/10" />

      <Text className="font-body text-sm text-brand-neutral">
        Selam {name},
      </Text>
      <Text className="mt-1 font-display text-3xl leading-9 text-white">
        Bugün ne{"\n"}oynuyoruz?
      </Text>

      <View className="mt-4 flex-row">
        <Button
          label="Etkinlik Oluştur"
          size="sm"
          icon="plus"
          onPress={onCreatePress}
        />
      </View>
    </Animated.View>
  );
}
