import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import { shadows, themeColors } from "@/constants/theme";
import { lightImpact } from "@/utils/haptics";

type HeroProps = {
  onCreatePress: () => void;
};

const HERO_IMAGE = require("../../../assets/images/sportnerhero.png");

export function Hero({ onCreatePress }: HeroProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(520).delay(100)}
      className="overflow-hidden rounded-hero border border-border-default bg-surface-primary"
      style={shadows.lg}
    >
      <ImageBackground
        source={HERO_IMAGE}
        resizeMode="stretch"
        className="h-[128px]"
        imageStyle={styles.heroImage}
      >
        <HeroOverlay />

        <View className="flex-1 flex-row items-center justify-between px-5 py-4">
          <View className="mr-3 flex-1">
            <Text
              numberOfLines={1}
              className="font-display text-[20px] leading-6 text-text-inverse"
            >
              Harekete <Text className="text-brand-primary">geç!</Text>
            </Text>
            <Text
              numberOfLines={1}
              className="mt-1 font-body text-[13px] leading-4 text-white/75"
            >
              Yakınında seni bekleyen etkinlikleri keşfet.
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Etkinlik oluştur"
            onPress={() => {
              lightImpact();
              onCreatePress();
            }}
            className="min-h-[44px] flex-row items-center justify-center gap-2 rounded-pill bg-brand-primary px-4 active:opacity-85"
          >
            <FontAwesome6
              name="plus"
              size={13}
              color={themeColors.text.onPrimary}
            />
            <Text
              className="font-body-bold text-[13px]"
              style={{ color: themeColors.text.onPrimary }}
            >
              Oluştur
            </Text>
          </Pressable>
        </View>
      </ImageBackground>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  heroImage: {
    opacity: 1,
  },
});

function HeroOverlay() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="hero-fade" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#06111a" stopOpacity="0.55" />
            <Stop offset="0.5" stopColor="#06111a" stopOpacity="0.22" />
            <Stop offset="1" stopColor="#06111a" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#hero-fade)" />
      </Svg>
    </View>
  );
}
