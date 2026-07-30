/**
 * Login form component
 */

import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

interface LoginFormProps {
  email: string;
  password: string;
  focusedField: "email" | "password" | null;
  isLoading: boolean;
  canSubmit: boolean;
  onEmailChange: (text: string) => void;
  onPasswordChange: (text: string) => void;
  onFocusChange: (field: "email" | "password" | null) => void;
  onSubmit: () => void;
  onModeChange: () => void;
}

const inputBaseClass =
  "min-h-[56px] flex-row items-center rounded-2xl border px-4 text-white bg-brand-surface";
const inputTextClass =
  "flex-1 font-body text-base text-white placeholder:text-brand-neutral";

const getIconColor = (
  field: "email" | "password" | null,
  focusedField: "email" | "password" | null,
) => (focusedField === field ? "#ccff00" : "#64748b");

export function LoginForm({
  email,
  password,
  focusedField,
  isLoading,
  canSubmit,
  onEmailChange,
  onPasswordChange,
  onFocusChange,
  onSubmit,
  onModeChange,
}: LoginFormProps) {
  return (
    <View className="px-6 pb-6 pt-7">
      <Text className="font-display text-4xl leading-tight text-white">
        Giriş Yap
      </Text>
      <Text className="mt-3 font-body text-base leading-6 text-brand-neutral">
        Hızlıca hesabına gir ve antrenman akışına devam et.
      </Text>

      <Pressable
        onPress={onModeChange}
        className="mt-5 flex-row gap-2 rounded-full border border-brand-tertiary bg-brand-raised p-1"
      >
        <Text className="flex-1 rounded-full bg-brand-primary px-4 py-2 text-center font-body text-sm font-semibold text-brand-secondary">
          Giriş Yap
        </Text>
        <Text className="flex-1 px-4 py-2 text-center font-body text-sm text-brand-neutral">
          Kayıt Ol
        </Text>
      </Pressable>

      <View
        className={`${inputBaseClass} mb-3 border ${
          focusedField === "email"
            ? "border-brand-primary"
            : "border-brand-tertiary"
        }`}
      >
        <FontAwesome6
          size={18}
          name="envelope"
          color={getIconColor("email", focusedField)}
        />
        <TextInput
          value={email}
          onChangeText={onEmailChange}
          onFocus={() => onFocusChange("email")}
          onBlur={() => onFocusChange(null)}
          placeholder="E-posta"
          placeholderTextColor="#64748b"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          className={`${inputTextClass} ml-3`}
        />
      </View>

      <View
        className={`${inputBaseClass} border ${
          focusedField === "password"
            ? "border-brand-primary"
            : "border-brand-tertiary"
        }`}
      >
        <FontAwesome6
          size={18}
          name="lock"
          color={getIconColor("password", focusedField)}
        />
        <TextInput
          value={password}
          onChangeText={onPasswordChange}
          onFocus={() => onFocusChange("password")}
          onBlur={() => onFocusChange(null)}
          placeholder="Şifre"
          placeholderTextColor="#64748b"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          className={`${inputTextClass} ml-3`}
        />
      </View>

      <Pressable
        onPress={onSubmit}
        disabled={isLoading || !canSubmit}
        style={({ pressed }) =>
          pressed && !(isLoading || !canSubmit)
            ? { transform: [{ scale: 0.99 }] }
            : undefined
        }
        className={`mt-5 min-h-[56px] items-center justify-center rounded-2xl border border-brand-primary bg-brand-primary ${
          isLoading || !canSubmit ? "opacity-70" : ""
        }`}
      >
        {isLoading ? (
          <ActivityIndicator color="#0f172a" />
        ) : (
          <Text className="font-body text-base font-semibold text-brand-secondary">
            Giriş Yap
          </Text>
        )}
      </Pressable>

      <Text className="mt-4 text-center font-mono text-xs text-brand-neutral">
        Giriş yaparak mevcut oturumunu devam ettirirsin.
      </Text>
    </View>
  );
}
