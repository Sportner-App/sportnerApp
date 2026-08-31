import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { useAppTour, type AppTourTarget } from "@/contexts/app-tour-context";

type TargetRect = { x: number; y: number; width: number; height: number };

const COPY: Record<
  AppTourTarget,
  { eyebrow: string; title: string; body: string }
> = {
  create: {
    eyebrow: "1 / 3",
    title: "Etkinliğini oluştur",
    body: "Ortadaki Etkinlik butonuyla birkaç adımda etkinlik açabilir, arkadaşlarını davet edebilirsin.",
  },
  conversations: {
    eyebrow: "2 / 3",
    title: "Sohbetlerin hep burada",
    body: "Kişisel sohbetlerine ve katıldığın etkinliklerin konuşmalarına bu kısayoldan ulaşabilirsin.",
  },
  discover: {
    eyebrow: "3 / 3",
    title: "Topluluğu keşfet",
    body: "Spor paylaşımlarını gör, etkileşime geç ve çevrendeki yeni sporcuları keşfet.",
  },
};

export function AppTourOverlay() {
  const { isVisible, target, step, getTarget, next, dismiss } = useAppTour();
  const { width, height } = useWindowDimensions();
  const [rect, setRect] = useState<TargetRect | null>(null);

  useEffect(() => {
    if (!isVisible) return;
    setRect(null);
    const timer = setTimeout(() => {
      getTarget(target)?.measureInWindow((x, y, targetWidth, targetHeight) => {
        setRect({ x, y, width: targetWidth, height: targetHeight });
      });
    }, 80);
    return () => clearTimeout(timer);
  }, [getTarget, isVisible, target]);

  if (!isVisible) return null;

  const copy = COPY[target];
  const pad = 7;
  const focus = rect
    ? {
        x: Math.max(6, rect.x - pad),
        y: Math.max(6, rect.y - pad),
        width: Math.min(width - 12, rect.width + pad * 2),
        height: rect.height + pad * 2,
      }
    : null;
  const cardBelow = target === "conversations";

  return (
    <Modal transparent visible statusBarTranslucent animationType="none">
      <Animated.View
        entering={FadeIn.duration(180)}
        exiting={FadeOut.duration(140)}
        className="flex-1"
      >
        {focus ? (
          <>
            <View
              className="absolute left-0 right-0 top-0 bg-black/80"
              style={{ height: focus.y }}
            />
            <View
              className="absolute left-0 bg-black/80"
              style={{ top: focus.y, width: focus.x, height: focus.height }}
            />
            <View
              className="absolute right-0 bg-black/80"
              style={{
                top: focus.y,
                left: focus.x + focus.width,
                height: focus.height,
              }}
            />
            <View
              className="absolute bottom-0 left-0 right-0 bg-black/80"
              style={{ top: focus.y + focus.height }}
            />
            <View
              pointerEvents="none"
              className="absolute rounded-[24px] border-2 border-brand-primary"
              style={focus}
            />
          </>
        ) : (
          <View className="absolute inset-0 bg-black/80" />
        )}

        <View
          className="absolute left-5 right-5 rounded-[26px] border border-white/15 bg-brand-surface p-5"
          style={
            cardBelow
              ? {
                  top: Math.min(
                    (focus?.y ?? 80) + (focus?.height ?? 48) + 18,
                    height - 290,
                  ),
                }
              : {
                  bottom: Math.max(
                    height - (focus?.y ?? height - 90) + 18,
                    112,
                  ),
                }
          }
        >
          <View className="flex-row items-center justify-between">
            <Text className="font-mono text-xs tracking-[2px] text-brand-primary">
              {copy.eyebrow}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Turu atla"
              onPress={dismiss}
              hitSlop={8}
            >
              <Text className="font-body-bold text-sm text-white/60">Atla</Text>
            </Pressable>
          </View>
          <Text className="mt-3 font-display text-2xl text-white">
            {copy.title}
          </Text>
          <Text className="mt-2 font-body text-sm leading-6 text-white/65">
            {copy.body}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={next}
            className="mt-5 flex-row items-center justify-center gap-2 rounded-full bg-brand-primary px-5 py-3.5 active:opacity-80"
          >
            <Text className="font-body-bold text-sm text-brand-secondary">
              {step === 2 ? "Turu Bitir" : "Devam Et"}
            </Text>
            <FontAwesome6
              name={step === 2 ? "check" : "arrow-right"}
              size={12}
              color="#06111a"
            />
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}
