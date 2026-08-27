import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { Platform, Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TAB_ITEMS } from "@/constants/tabs";
import { themeColors } from "@/constants/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function TabButton({
  label,
  icon,
  focused,
  isAction,
  onPress,
}: {
  label: string;
  icon: (typeof TAB_ITEMS)[number]["icon"];
  focused: boolean;
  isAction?: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: (1 - glow.value) * 0.34,
    transform: [{ scale: 0.6 + glow.value * 0.65 }],
  }));

  const pressIn = () => {
    scale.value = withTiming(0.94, { duration: 90 });
    glow.value = 0;
    glow.value = withTiming(1, {
      duration: 420,
      easing: Easing.out(Easing.cubic),
    });
  };

  const pressOut = () => {
    scale.value = withTiming(1, { duration: 150 });
  };

  if (isAction) {
    return (
      <View className="flex-1 items-center justify-center">
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={onPress}
          onPressIn={pressIn}
          onPressOut={pressOut}
          style={animatedStyle}
          className="-mt-5 h-[62px] w-[62px] items-center justify-center rounded-full border border-white/25 bg-white/10"
        >
          <View
            className="h-[52px] w-[52px] items-center justify-center gap-0.5 overflow-hidden rounded-full bg-brand-primary"
            style={{
              shadowColor: themeColors.brand.primary,
              shadowOpacity: 0.32,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 6 },
              elevation: 8,
            }}
          >
            <Animated.View
              pointerEvents="none"
              style={glowStyle}
              className="absolute h-12 w-12 rounded-full bg-white"
            />
            <FontAwesome6
              name={icon}
              size={15}
              color={themeColors.text.onPrimary}
            />
            <Text
              className="font-body-bold text-[8px] leading-[9px]"
              style={{ color: themeColors.text.onPrimary }}
            >
              Etkinlik
            </Text>
          </View>
        </AnimatedPressable>
      </View>
    );
  }

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      style={animatedStyle}
      className="flex-1 items-center justify-center px-0.5"
    >
      <View
        className={`min-h-[48px] min-w-[52px] items-center justify-center gap-1 rounded-[20px] border px-2 ${
          focused
            ? "border-white/20 bg-white/10"
            : "border-transparent bg-transparent"
        }`}
      >
        <View className="h-5 items-center justify-center">
          <FontAwesome6
            name={icon}
            size={16}
            color={
              focused ? themeColors.brand.primary : themeColors.text.secondary
            }
          />
        </View>
        <Text
          numberOfLines={1}
          className={`text-center font-body-bold text-[10px] leading-3 tracking-[-0.1px] ${
            focused ? "text-text-primary" : "text-text-tertiary"
          }`}
        >
          {label}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

export function GlassTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      pointerEvents="box-none"
      className="absolute bottom-0 left-0 right-0 px-3"
      style={{ paddingBottom: Math.max(insets.bottom, 9) }}
    >
      <View
        className="overflow-hidden rounded-[30px] border border-white/25"
        style={{
          backgroundColor: "rgba(6, 17, 26, 0.24)",
          shadowColor: "#000000",
          shadowOpacity: 0.38,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 10 },
          elevation: 12,
        }}
      >
        <BlurView
          intensity={Platform.OS === "ios" ? 78 : 52}
          tint="dark"
          experimentalBlurMethod={
            Platform.OS === "android" ? "dimezisBlurView" : undefined
          }
          style={{ overflow: "hidden" }}
        >
          <View
            pointerEvents="none"
            className="absolute inset-0 bg-background-primary/20"
          />
          <View
            pointerEvents="none"
            className="absolute inset-x-5 top-0 h-px bg-white/40"
          />
          <View
            pointerEvents="none"
            className="absolute inset-x-8 bottom-0 h-px bg-white/10"
          />

          <View className="h-[72px] flex-row items-center px-1.5">
            {TAB_ITEMS.map((item) => {
              const routeIndex = state.routes.findIndex(
                (route) => route.name === item.key,
              );
              const focused = !item.isAction && routeIndex === state.index;

              return (
                <TabButton
                  key={item.key}
                  label={item.label}
                  icon={item.icon}
                  focused={focused}
                  isAction={item.isAction}
                  onPress={() => {
                    if (item.isAction) {
                      router.push("/events/create");
                      return;
                    }

                    const route = state.routes[routeIndex];
                    if (!route) {
                      return;
                    }

                    const event = navigation.emit({
                      type: "tabPress",
                      target: route.key,
                      canPreventDefault: true,
                    });

                    if (!focused && !event.defaultPrevented) {
                      navigation.navigate(route.name, route.params);
                    }
                  }}
                />
              );
            })}
          </View>
        </BlurView>
      </View>
    </View>
  );
}
