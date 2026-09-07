import { ScrollView, Text } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { Button, Input } from "@/components";
import type { useOnboarding } from "@/hooks/use-onboarding";

type IdentityStepProps = {
  form: ReturnType<typeof useOnboarding>;
};

export function IdentityStep({ form }: IdentityStepProps) {
  const { t } = useTranslation("onboarding");
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="flex-grow px-6 pb-10"
      contentContainerStyle={{ paddingTop: Math.max(insets.top, 16) + 8 }}
    >
      <Animated.View entering={FadeInDown.duration(420)}>
        <Text className="font-display text-5xl leading-[52px] text-text-primary">
          {t("identity.title")}
        </Text>
        <Text className="mt-3 font-body text-base leading-6 text-brand-neutral">
          {t("identity.subtitle")}
        </Text>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.duration(500).delay(120)}
        className="mt-8 gap-3 rounded-[28px] border border-border-default bg-surface-primary p-5"
      >
        <Input
          icon="at"
          placeholder={t("identity.usernamePlaceholder")}
          value={form.username}
          onChangeText={form.setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          textContentType="username"
          helperText={t("identity.usernameHelper")}
          error={form.identityFieldErrors.username}
        />
        <Input
          icon="user"
          placeholder={t("identity.firstNamePlaceholder")}
          value={form.firstName}
          onChangeText={form.setFirstName}
          autoCapitalize="words"
          autoCorrect={false}
          textContentType="givenName"
          error={form.identityFieldErrors.firstName}
        />
        <Input
          icon="user"
          placeholder={t("identity.lastNamePlaceholder")}
          value={form.lastName}
          onChangeText={form.setLastName}
          autoCapitalize="words"
          autoCorrect={false}
          textContentType="familyName"
        />
        <Input
          icon="calendar-days"
          label={t("identity.birthDateLabel")}
          placeholder={t("identity.birthDatePlaceholder")}
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
          label={t("identity.submit")}
          size="lg"
          isLoading={form.isIdentitySubmitting}
          disabled={form.isIdentitySubmitting}
          onPress={form.submitIdentity}
        />
      </Animated.View>
    </ScrollView>
  );
}
