import { useEffect, useState } from "react";
import { KeyboardEvents } from "react-native-keyboard-controller";

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
 * keyboard-controller olayları kullanılıyor: RN'nin `Keyboard` olayları
 * Android'de `will` sürümlerini vermiyor ve edge-to-edge telefonlarda yükseklik
 * güvenilir gelmiyordu. Bu olaylar iki platformda da klavye animasyonu
 * başlarken gelir.
 */
export function useKeyboardHeight() {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showSub = KeyboardEvents.addListener("keyboardWillShow", (event) => {
      setHeight(event.height);
    });
    const hideSub = KeyboardEvents.addListener("keyboardWillHide", () => {
      setHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return height;
}
