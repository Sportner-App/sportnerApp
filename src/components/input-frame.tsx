import type { RefObject } from "react";
import { Pressable, type PressableProps, type TextInput } from "react-native";

type InputFrameProps = PressableProps & {
  inputRef: RefObject<TextInput | null>;
  disabled?: boolean;
};

/**
 * Giriş kutusunun tamamını dokunulabilir yapar. Kutu (dolgu, ikon, boşluk)
 * TextInput'tan büyük olduğunda dokunuşun yalnızca tek satırlık TextInput'a
 * düşmesi ilk dokunuşta odağın kaçmasına yol açıyordu; burada kutuya yapılan
 * her dokunuş TextInput'u odaklar. İçteki Pressable'lar (göz, temizle) kendi
 * işini yapar.
 */
export function InputFrame({
  inputRef,
  disabled,
  children,
  onPress,
  ...rest
}: InputFrameProps) {
  return (
    <Pressable
      {...rest}
      accessible={false}
      onPress={(event) => {
        onPress?.(event);
        if (!disabled) inputRef.current?.focus();
      }}
    >
      {children}
    </Pressable>
  );
}
