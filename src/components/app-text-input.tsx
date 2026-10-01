import { forwardRef } from "react";
import { TextInput, type TextInputProps } from "react-native";

/**
 * Proje geneli TextInput. Tek satırlık alanlarda `text-*` sınıflarının verdiği
 * lineHeight kaldırılır: iOS düzenleme modunda lineHeight'ı farklı uyguladığı
 * için odaktayken harflerin alt kısmı (g, ş, ç) kesiliyordu. Çok satırlı
 * alanlarda paragraf aralığı için lineHeight korunur.
 */
export const AppTextInput = forwardRef<TextInput, TextInputProps>(
  function AppTextInput({ style, multiline, ...props }, ref) {
    return (
      <TextInput
        ref={ref}
        multiline={multiline}
        style={multiline ? style : [style, { lineHeight: undefined }]}
        {...props}
      />
    );
  },
);
