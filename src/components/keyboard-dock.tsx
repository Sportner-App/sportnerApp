import type { PropsWithChildren } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useKeyboardHeight } from "@/hooks/use-keyboard-height";

/**
 * Klavyeye yapışık alt çubuk (ör. mesaj yazma alanı). iOS klavyesi yarı saydam:
 * arkasına düz zemin konmazsa altındaki fotoğraf klavyeden görünüyor, bu yüzden
 * zemin klavyenin arkasına kadar uzuyor. Alt boşluk da klavyeye göre ayarlanıyor.
 */
export function KeyboardDock({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();

  return (
    <View
      className="border-t border-border-default bg-background-primary"
      style={{
        paddingBottom: keyboardHeight > 0 ? 8 : Math.max(insets.bottom, 10),
      }}
    >
      {children}
      <View
        pointerEvents="none"
        className="absolute inset-x-0 top-full bg-background-primary"
        style={{ height: keyboardHeight }}
      />
    </View>
  );
}
