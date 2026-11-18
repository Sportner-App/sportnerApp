import { forwardRef } from "react";
import { Platform, type ScrollView } from "react-native";
import {
  KeyboardAwareScrollView,
  type KeyboardAwareScrollViewProps,
} from "react-native-keyboard-controller";

import {
  KEYBOARD_TOOLBAR_OFFSET,
  useKeyboardToolbarVisible,
} from "@/hooks/use-keyboard-toolbar-visible";

type KeyboardScrollViewProps = KeyboardAwareScrollViewProps & {
  /**
   * Odaklanan alanın klavyenin üstünde ne kadar boşlukla duracağı. Klavyenin
   * üstündeki "Kapat" araç çubuğu payı otomatik eklenir.
   */
  extraBottomOffset?: number;
  /**
   * Modal içindeki sheet'lerde kök seviyedeki araç çubuğu görünmez; pay
   * eklenmesin diye false verilir.
   */
  withToolbarOffset?: boolean;
};

/**
 * Metin girişi olan her kaydırılabilir alanın ortak kabuğu.
 *
 * Neden ortak: RN'nin KeyboardAvoidingView'i Android'de `behavior` verilmeden
 * hiçbir şey yapmıyor ve edge-to-edge açık telefonlarda (Android 15+) pencere
 * klavyeyle küçülmediği için `adjustResize` da işe yaramıyor. Bu yüzden bazı
 * Android'lerde odaklanan alan klavyenin arkasında kalıyordu. keyboard-controller
 * klavyenin gerçek konumunu iki platformda da aynı şekilde ölçüp odaklanan alanı
 * görünür alana kaydırıyor.
 */
export const KeyboardScrollView = forwardRef<
  ScrollView,
  KeyboardScrollViewProps
>(function KeyboardScrollView(
  { extraBottomOffset = 16, withToolbarOffset = true, ...props },
  ref,
) {
  const toolbarVisible = useKeyboardToolbarVisible();
  const toolbarOffset =
    withToolbarOffset && toolbarVisible ? KEYBOARD_TOOLBAR_OFFSET : 0;

  return (
    <KeyboardAwareScrollView
      ref={ref}
      bottomOffset={toolbarOffset + extraBottomOffset}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      showsVerticalScrollIndicator={false}
      {...props}
    />
  );
});
