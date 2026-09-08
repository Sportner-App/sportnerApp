import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StatusBar,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { useAppTourCopy } from "@/constants/components";
import { useAppTour } from "@/contexts/app-tour-context";

type TargetRect = { x: number; y: number; width: number; height: number };

/**
 * `measureInWindow`, status bar'ın altından başlayan uygulama penceresine göre
 * ölçüyor; aşağıdaki Modal ise `statusBarTranslucent` ile ekranın tamamını
 * kaplıyor. Android'de iki koordinat uzayı arasındaki fark status bar kadar
 * oluyor ve telafi edilmezse delik hedefin yukarısına düşüyor. iOS'ta Modal
 * zaten ölçümle aynı uzayda.
 */
const MEASURE_Y_OFFSET =
  Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0;

export function AppTourOverlay() {
  const { t } = useTranslation("components");
  const copyByTarget = useAppTourCopy();
  const { isVisible, target, step, getTarget, next, dismiss } = useAppTour();
  const { width, height } = useWindowDimensions();
  const [rect, setRect] = useState<TargetRect | null>(null);

  useEffect(() => {
    if (!isVisible) return;
    setRect(null);
    const timer = setTimeout(() => {
      getTarget(target)?.measureInWindow((x, y, targetWidth, targetHeight) => {
        setRect({
          x,
          y: y + MEASURE_Y_OFFSET,
          width: targetWidth,
          height: targetHeight,
        });
      });
    }, 80);
    return () => clearTimeout(timer);
  }, [getTarget, isVisible, target]);

  if (!isVisible) return null;

  const copy = copyByTarget[target];
  const pad = 7;
  const focus = rect
    ? {
        left: Math.max(6, rect.x - pad),
        top: Math.max(6, rect.y - pad),
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
              style={{ height: focus.top }}
            />
            <View
              className="absolute left-0 bg-black/80"
              style={{ top: focus.top, width: focus.left, height: focus.height }}
            />
            <View
              className="absolute right-0 bg-black/80"
              style={{
                top: focus.top,
                left: focus.left + focus.width,
                height: focus.height,
              }}
            />
            <View
              className="absolute bottom-0 left-0 right-0 bg-black/80"
              style={{ top: focus.top + focus.height }}
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
                    (focus?.top ?? 80) + (focus?.height ?? 48) + 18,
                    height - 290,
                  ),
                }
              : {
                  bottom: Math.max(
                    height - (focus?.top ?? height - 90) + 18,
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
              accessibilityLabel={t("appTour.skipAccessibility")}
              onPress={dismiss}
              hitSlop={8}
            >
              <Text className="font-body-bold text-sm text-white/60">
                {t("appTour.skip")}
              </Text>
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
              {step === 2 ? t("appTour.finish") : t("appTour.continue")}
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
