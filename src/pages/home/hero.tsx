import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import { sportImageForSlug } from "@/constants/sport-images";
import { shadows, themeColors } from "@/constants/theme";
import { lightImpact } from "@/utils/haptics";

type HeroProps = {
  onCreatePress: () => void;
};

const HERO_IMAGE = sportImageForSlug("running");

export function Hero({ onCreatePress }: HeroProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(520).delay(100)}
      className="overflow-hidden rounded-hero border border-border-default bg-surface-primary"
      style={shadows.lg}
    >
      <View className="h-[310px]">
        {HERO_IMAGE ? (
          <Image
            source={HERO_IMAGE}
            resizeMode="cover"
            style={StyleSheet.absoluteFill}
          />
        ) : null}

        <HeroOverlay />

        <View
          pointerEvents="none"
          className="absolute -right-12 top-10 h-48 w-48 rounded-full border-[28px] border-brand-primary/20"
        />
        <View
          pointerEvents="none"
          className="absolute right-16 top-7 h-7 w-7 rounded-full bg-brand-primary/20"
        />

        <View className="flex-1 justify-end p-5">
          <View className="w-[72%]">
            <Text className="font-display text-[43px] leading-[43px] text-text-inverse">
              HAREKETE
            </Text>
            <Text className="font-display text-[43px] leading-[43px] text-brand-primary">
              GEÇ!
            </Text>
            <Text className="mt-4 max-w-[230px] font-body text-[15px] leading-5 text-white/75">
              Yakınında seni bekleyen etkinlikleri keşfet.
            </Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Etkinlik oluştur"
              onPress={() => {
                lightImpact();
                onCreatePress();
              }}
              className="mt-5 min-h-[52px] flex-row items-center justify-center gap-3 self-start rounded-pill bg-brand-primary px-6 active:opacity-85"
            >
              <FontAwesome6
                name="plus"
                size={16}
                color={themeColors.text.onPrimary}
              />
              <Text
                className="font-body-bold text-[15px]"
                style={{ color: themeColors.text.onPrimary }}
              >
                Etkinlik Oluştur
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

function HeroOverlay() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="hero-dark-x" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#06111a" stopOpacity="0.98" />
            <Stop offset="0.55" stopColor="#06111a" stopOpacity="0.72" />
            <Stop offset="1" stopColor="#06111a" stopOpacity="0.18" />
          </LinearGradient>
          <LinearGradient id="hero-dark-y" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#06111a" stopOpacity="0.22" />
            <Stop offset="1" stopColor="#06111a" stopOpacity="0.82" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#hero-dark-x)" />
        <Rect width="100%" height="100%" fill="url(#hero-dark-y)" />
      </Svg>
    </View>
  );
}
