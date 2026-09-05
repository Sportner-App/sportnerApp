import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { themeColors } from "@/constants/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type SocialProvider = "google" | "apple";

/** Logo rozetleri: Google beyaz çip üzerinde renkli G, Apple koyu çip üzerinde beyaz elma. */
const PROVIDER_MARK: Record<
  SocialProvider,
  { chipClassName: string; iconColor: string; iconSize: number }
> = {
  google: {
    chipClassName: "bg-white",
    iconColor: "#4285F4",
    iconSize: 15,
  },
  apple: {
    chipClassName: "bg-white/10",
    iconColor: "#ffffff",
    iconSize: 17,
  },
};

type SocialAuthButtonProps = {
  provider: SocialProvider;
  label: string;
  isLoading?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function SocialAuthButton({
  provider,
  label,
  isLoading = false,
  disabled = false,
  onPress,
}: SocialAuthButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const mark = PROVIDER_MARK[provider];
  const isInactive = disabled || isLoading;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={isInactive}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.98, { duration: 100 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 100 });
      }}
      style={animatedStyle}
      className={`min-h-[58px] flex-row items-center gap-3 rounded-2xl border border-border-default bg-surface-primary px-4 active:bg-surface-secondary ${
        isInactive ? "opacity-55" : ""
      }`}
    >
      <View
        className={`h-9 w-9 items-center justify-center rounded-full ${mark.chipClassName}`}
      >
        <FontAwesome6
          name={provider}
          size={mark.iconSize}
          color={mark.iconColor}
        />
      </View>

      <Text className="flex-1 font-body-bold text-[15px] text-text-primary">
        {label}
      </Text>

      {isLoading ? (
        <ActivityIndicator size="small" color={themeColors.brand.primary} />
      ) : (
        <FontAwesome6
          name="arrow-right"
          size={13}
          color={themeColors.text.tertiary}
        />
      )}
    </AnimatedPressable>
  );
}
