import { View } from "react-native";
import Animated, {
  FadeInDown,
  FadeOutDown,
  useReducedMotion,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components";
import { shadows } from "@/constants/theme";
import { useKeyboardHeight } from "@/hooks/use-keyboard-height";

type SubmitBarProps = {
  disabled: boolean;
  isLoading: boolean;
  onSubmit: () => void;
  label: string;
  onBack?: () => void;
  backLabel?: string;
  showIcon?: boolean;
  pressScale?: number;
  haptic?: "light";
  loadingLabel?: string;
};

export function SubmitBar({
  disabled,
  isLoading,
  onSubmit,
  label,
  onBack,
  backLabel,
  showIcon = true,
  pressScale,
  haptic,
  loadingLabel,
}: SubmitBarProps) {
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const reducedMotion = useReducedMotion();
  const isKeyboardOpen = keyboardHeight > 0;

  const bottomPadding = insets.bottom + 10;

  /**
   * Klavye açıkken gizleniyor.
   *
   * Bir metin alanı odaktayken bu çubuk klavyenin hemen üstüne yapışıyor ve
   * parlak birincil buton dikkati topluyordu: kullanıcı başlığı yazar yazmaz
   * "Devam Et"e basıp açıklama gibi opsiyonel alanları doldurmadan
   * ilerliyordu. Alanlar arası geçişi klavye araç çubuğundaki oklar zaten
   * sağlıyor; "Kapat"a basıldığında çubuk geri geliyor.
   */
  if (isKeyboardOpen) {
    return null;
  }

  const primary = (
    <Button
      label={label}
      size="lg"
      icon={showIcon ? "paper-plane" : undefined}
      disabled={disabled}
      isLoading={isLoading}
      loadingLabel={loadingLabel}
      pressScale={pressScale}
      haptic={haptic}
      onPress={onSubmit}
    />
  );

  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeInDown.duration(180)}
      exiting={reducedMotion ? undefined : FadeOutDown.duration(120)}
      className="border-t border-border-default bg-background-primary/95 px-5 pt-3"
      style={[shadows.lg, { paddingBottom: bottomPadding }]}
    >
      {onBack ? (
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button
              label={backLabel ?? ""}
              size="lg"
              variant="outline"
              icon="arrow-left"
              disabled={isLoading}
              pressScale={pressScale}
              haptic={haptic}
              onPress={onBack}
            />
          </View>
          <View className="flex-1">{primary}</View>
        </View>
      ) : (
        primary
      )}
    </Animated.View>
  );
}
