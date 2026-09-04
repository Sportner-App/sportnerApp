import { ScrollView, Text } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Input } from "@/components";
import type { useOnboarding } from "@/hooks/use-onboarding";

type IdentityStepProps = {
  form: ReturnType<typeof useOnboarding>;
};

export function IdentityStep({ form }: IdentityStepProps) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="flex-grow px-6 pb-10"
      contentContainerStyle={{ paddingTop: Math.max(insets.top, 16) + 8 }}
    >
      <Animated.View entering={FadeInDown.duration(420)}>
        <Text className="font-display text-5xl leading-[52px] text-text-primary">
          Seni{"\n"}tanıyalım.
        </Text>
        <Text className="mt-3 font-body text-base leading-6 text-brand-neutral">
          Profilini oluşturmak için birkaç bilgiye ihtiyacımız var.
        </Text>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.duration(500).delay(120)}
        className="mt-8 gap-3 rounded-[28px] border border-border-default bg-surface-primary p-5"
      >
        <Input
          icon="at"
          placeholder="Kullanıcı adı"
          value={form.username}
          onChangeText={form.setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          textContentType="username"
          helperText="Senin için önerdik, istersen değiştirebilirsin"
          error={form.identityFieldErrors.username}
        />
        <Input
          icon="user"
          placeholder="Ad"
          value={form.firstName}
          onChangeText={form.setFirstName}
          autoCapitalize="words"
          autoCorrect={false}
          textContentType="givenName"
          error={form.identityFieldErrors.firstName}
        />
        <Input
          icon="user"
          placeholder="Soyad (opsiyonel)"
          value={form.lastName}
          onChangeText={form.setLastName}
          autoCapitalize="words"
          autoCorrect={false}
          textContentType="familyName"
        />
        <Input
          icon="calendar-days"
          label="Doğum tarihi"
          placeholder="GG.AA.YYYY"
          value={form.identityBirthDate}
          onChangeText={form.setIdentityBirthDate}
          keyboardType="number-pad"
          maxLength={10}
          error={form.identityFieldErrors.birthDate}
        />
      </Animated.View>

      <Animated.View
        entering={FadeInUp.duration(500).delay(200)}
        className="mt-8"
      >
        <Button
          label="Devam et"
          size="lg"
          isLoading={form.isIdentitySubmitting}
          disabled={form.isIdentitySubmitting}
          onPress={form.submitIdentity}
        />
      </Animated.View>
    </ScrollView>
  );
}
