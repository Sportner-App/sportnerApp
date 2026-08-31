import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  Text,
  View,
  type View as ViewType,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TAB_ITEMS } from "@/constants/tabs";
import { themeColors } from "@/constants/theme";
import { useAppTour, useSession } from "@/contexts";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { getMyProfile } from "@/services/profile-service";
import type { UserProfile } from "@/types/profile";
import { Avatar } from "./avatar";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function TabButton({
  label,
  icon,
  focused,
  isAction,
  avatarUrl,
  avatarName,
  onPress,
  tourTargetRef,
}: {
  label: string;
  icon: (typeof TAB_ITEMS)[number]["icon"];
  focused: boolean;
  isAction?: boolean;
  avatarUrl?: string | null;
  avatarName?: string | null;
  onPress: () => void;
  tourTargetRef?: (node: ViewType | null) => void;
}) {
  const isProfile = label === "Profil";
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
      <View
        ref={tourTargetRef}
        collapsable={false}
        className="h-full flex-1 items-center justify-center"
      >
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={onPress}
          onPressIn={pressIn}
          onPressOut={pressOut}
          style={animatedStyle}
          className="h-[60px] w-[60px] items-center justify-center rounded-full border border-white/25 bg-white/10"
        >
          <View
            className="h-[50px] w-[50px] items-center justify-center gap-0.5 overflow-hidden rounded-full bg-brand-primary"
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
              className="absolute h-11 w-11 rounded-full bg-white"
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
    <View ref={tourTargetRef} collapsable={false} className="h-full flex-1">
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={label}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={animatedStyle}
        className="h-full items-center justify-center px-0.5"
      >
        <View
          className={`min-h-[48px] min-w-[52px] items-center justify-center rounded-[20px] border px-2 ${
            focused
              ? "border-white/20 bg-white/10"
              : "border-transparent bg-transparent"
          }`}
        >
          <View
            className={`${isProfile ? "h-9" : "h-6"} items-center justify-center`}
          >
            {isProfile ? (
              <Avatar
                uri={avatarUrl}
                name={avatarName}
                size={34}
                borderWidth={focused ? 2 : 1}
                borderColor={
                  focused
                    ? themeColors.brand.primary
                    : themeColors.text.secondary
                }
                previewable={false}
              />
            ) : (
              <FontAwesome6
                name={icon}
                size={16}
                color={
                  focused
                    ? themeColors.brand.primary
                    : themeColors.text.secondary
                }
              />
            )}
          </View>
          {!isProfile ? (
            <Text
              numberOfLines={1}
              className={`mt-1 text-center font-body-bold text-[10px] leading-3 tracking-[-0.1px] ${
                focused ? "text-white" : "text-white/55"
              }`}
            >
              {label}
            </Text>
          ) : null}
        </View>
      </AnimatedPressable>
    </View>
  );
}

export function GlassTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { registerTarget } = useAppTour();
  const { isAuthenticated, requireAuth } = useRequireAuth();

  useEffect(() => {
    let active = true;
    if (!isAuthenticated) {
      setProfile(null);
      return;
    }
    void getMyProfile()
      .then((next) => {
        if (active) setProfile(next);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [isAuthenticated, state.index]);

  const avatarUrl = profile?.avatarUrl ?? user?.avatarUrl;
  const avatarName = profile?.fullName ?? user?.fullName ?? user?.username;

  return (
    <View
      pointerEvents="box-none"
      className="absolute bottom-0 left-0 right-0 px-3"
      style={{ paddingBottom: Math.max(insets.bottom, 9) }}
    >
      <View
        className="overflow-hidden rounded-[30px] border border-white/30"
        style={{
          backgroundColor: "rgba(6, 17, 26, 0)",
          shadowColor: "#000000",
          shadowOpacity: 0.3,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 10 },
          elevation: 12,
        }}
      >
        <BlurView
          intensity={Platform.OS === "ios" ? 68 : 46}
          tint={Platform.OS === "ios" ? "systemUltraThinMaterialDark" : "dark"}
          experimentalBlurMethod={
            Platform.OS === "android" ? "dimezisBlurView" : undefined
          }
          style={{ overflow: "hidden" }}
        >
          <View
            pointerEvents="none"
            className="absolute inset-0 bg-background-primary/10"
          />
          <View
            pointerEvents="none"
            className="absolute inset-x-5 top-0 h-px bg-white/50"
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
                  avatarUrl={item.key === "profile" ? avatarUrl : undefined}
                  avatarName={item.key === "profile" ? avatarName : undefined}
                  tourTargetRef={
                    item.isAction
                      ? registerTarget("create")
                      : item.key === "discover"
                        ? registerTarget("discover")
                        : undefined
                  }
                  onPress={() => {
                    if (item.isAction) {
                      if (
                        !requireAuth(
                          "Etkinlik oluşturmak için giriş yapmalısın.",
                        )
                      )
                        return;
                      router.push("/events/create");
                      return;
                    }

                    if (
                      (item.key === "activity" || item.key === "profile") &&
                      !requireAuth(
                        item.key === "activity"
                          ? "Etkinliklerini görmek için giriş yapmalısın."
                          : "Profilini görmek için giriş yapmalısın.",
                      )
                    )
                      return;

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
