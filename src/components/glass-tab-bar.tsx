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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function useBubblePress() {
  const scale = useSharedValue(1);
  const bubble = useSharedValue(0);

  const pressIn = () => {
    scale.value = withTiming(0.96, { duration: 90 });
    bubble.value = 0;
    bubble.value = withTiming(1, {
      duration: 420,
      easing: Easing.out(Easing.cubic),
    });
  };

  const pressOut = () => {
    scale.value = withTiming(1, { duration: 140 });
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: (1 - bubble.value) * 0.45,
    transform: [{ scale: 0.25 + bubble.value * 1.35 }],
  }));

  return { pressIn, pressOut, containerStyle, bubbleStyle };
}

function Bubble({
  style,
  size = 44,
  color = "rgba(204, 255, 0, 0.55)",
}: {
  style: object;
  size?: number;
  color?: string;
}) {
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          left: "50%",
          top: "50%",
          marginLeft: -size / 2,
          marginTop: -size / 2,
        },
        style,
      ]}
    />
  );
}

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
  const { pressIn, pressOut, containerStyle, bubbleStyle } = useBubblePress();

  if (isAction) {
    return (
      <View className="flex-1 items-center justify-center">
        <AnimatedPressable
          onPress={onPress}
          onPressIn={pressIn}
          onPressOut={pressOut}
          style={containerStyle}
          className="-mt-5 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel={label}
        >
          <View className="h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-white/25 bg-brand-primary shadow-lg shadow-brand-primary">
            <Bubble
              style={bubbleStyle}
              size={56}
              color="rgba(255, 255, 255, 0.35)"
            />
            <FontAwesome6 name={icon} size={18} color="#0f172a" />
          </View>
        </AnimatedPressable>
      </View>
    );
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      style={containerStyle}
      className="min-w-[56px] flex-1 items-center justify-center gap-1 overflow-hidden py-1"
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
    >
      <View className="h-11 w-11 items-center justify-center">
        <Bubble style={bubbleStyle} size={48} />
        <View
          className={`z-10 h-9 w-9 items-center justify-center rounded-2xl ${
            focused ? "bg-brand-primary/20" : "bg-transparent"
          }`}
        >
          <FontAwesome6
            name={icon}
            size={16}
            color={focused ? "#ccff00" : "#94a3b8"}
          />
        </View>
      </View>
      <Text
        numberOfLines={1}
        className={`px-0.5 text-center font-mono text-[9px] ${
          focused ? "text-brand-primary" : "text-slate-400"
        }`}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

/**
 * Kenarlardan boşluklu, yuvarlatılmış liquid-glass bottom tab bar.
 */
export function GlassTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      pointerEvents="box-none"
      className="absolute bottom-0 left-0 right-0 px-4"
      style={{ paddingBottom: Math.max(insets.bottom, 10) }}
    >
      <View
        className="overflow-hidden rounded-[28px] border border-white/15"
        style={{
          shadowColor: "#000",
          shadowOpacity: 0.28,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 12,
        }}
      >
        <BlurView
          intensity={Platform.OS === "ios" ? 35 : 45}
          tint="dark"
          style={{ overflow: "hidden" }}
        >
          <View
            pointerEvents="none"
            className="absolute inset-0 bg-[#0f172a]/25"
          />
          <View
            pointerEvents="none"
            className="absolute inset-x-0 top-0 h-px bg-white/20"
          />

          <View className="h-[68px] flex-row items-center px-1.5">
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
