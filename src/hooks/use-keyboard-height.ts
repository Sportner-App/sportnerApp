import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

/**
 * Klavyenin kapladığı yükseklik; klavye kapalıyken 0.
 *
 * İki yerde gerekiyor:
 *
 * - **Alt güvenli alan payı:** `insets.bottom` home indicator içindir. Klavye
 *   açıkken o alanı zaten klavye kapatıyor, pay eklenirse butonlarla klavye
 *   arasında boşluk kalıyor.
 * - **Sabit yükseklik sınırları:** klavye açılınca ekranda kalan alan azalıyor.
 *   Sınır bunu hesaba katmazsa içerik üstten taşıyor.
 *
 * iOS'ta `will` olayları kullanılıyor: klavye animasyonuyla aynı karede
 * güncellenip zıplama olmasın diye. Android'de o olaylar yok, `did` kalıyor.
 */
export function useKeyboardHeight() {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return height;
}
