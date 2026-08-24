import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeOutUp,
  LinearTransition,
} from "react-native-reanimated";

import { Button, Input, SegmentedTabs } from "@/components";
import { AUTH_COPY, AUTH_MODE_OPTIONS } from "@/constants/auth";
import { useAuthForm } from "@/hooks/use-auth-form";

import { AnimatedBackground } from "./animated-background";

const cardTransition = LinearTransition.duration(220);

export function AuthScreen() {
  const form = useAuthForm();
  const copy = AUTH_COPY[form.mode];

  return (
    <View className="flex-1 bg-brand-secondary">
      <AnimatedBackground />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="flex-grow justify-center px-6 py-14"
        >
          <Animated.View
            entering={FadeInDown.duration(500)}
            className="mb-10 flex-row items-center gap-2.5"
          >
            <View className="h-2.5 w-2.5 rounded-full bg-brand-primary" />
            <Text className="font-mono text-xs tracking-[4px] text-brand-neutral">
              SPORTNER
            </Text>
          </Animated.View>

          <Animated.View
            key={`headline-${form.mode}`}
            entering={FadeInDown.duration(450)}
          >
            <Text className="font-display text-5xl leading-[52px] text-white">
              {copy.title}
            </Text>
            <Text className="mt-3 font-body text-base leading-6 text-brand-neutral">
              {copy.subtitle}
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.duration(600).delay(150)}
            layout={cardTransition}
            className="mt-9 rounded-[28px] border border-white/10 bg-brand-surface/90 p-5"
          >
            <SegmentedTabs
              options={AUTH_MODE_OPTIONS}
              value={form.mode}
              onChange={form.setMode}
              disabled={form.isLoading}
            />

            <View className="mt-5 gap-3">
              {!form.isLogin && (
                <>
                  <Animated.View
                    entering={FadeInDown.duration(280)}
                    exiting={FadeOutUp.duration(200)}
                  >
                    <Input
                      icon="user"
                      placeholder="Ad"
                      value={form.firstName}
                      onChangeText={form.setFirstName}
                      autoCapitalize="words"
                      autoCorrect={false}
                      textContentType="givenName"
                    />
                  </Animated.View>

                  <Animated.View
                    entering={FadeInDown.duration(280)}
                    exiting={FadeOutUp.duration(200)}
                  >
                    <Input
                      icon="user"
                      placeholder="Soyad (opsiyonel)"
                      value={form.lastName}
                      onChangeText={form.setLastName}
                      autoCapitalize="words"
                      autoCorrect={false}
                      textContentType="familyName"
                    />
                  </Animated.View>
                </>
              )}

              <Animated.View layout={cardTransition}>
                <Input
                  icon="at"
                  placeholder="Kullanıcı adı"
                  value={form.username}
                  onChangeText={form.setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username"
                  textContentType="username"
                  helperText={copy.helper}
                />
              </Animated.View>

              <Animated.View layout={cardTransition}>
                <Input
                  icon="lock"
                  isPassword
                  placeholder="Şifre"
                  value={form.password}
                  onChangeText={form.setPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete={form.isLogin ? "password" : "new-password"}
                  textContentType={form.isLogin ? "password" : "newPassword"}
                />
              </Animated.View>
            </View>

            <Animated.View layout={cardTransition} className="mt-6">
              <Button
                label={copy.submit}
                size="lg"
                isLoading={form.isLoading}
                disabled={!form.canSubmit || !form.isReady}
                onPress={form.submit}
              />
            </Animated.View>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.duration(600).delay(300)}
            layout={cardTransition}
            className="mt-8 flex-row justify-center gap-1.5"
          >
            <Text className="font-body text-sm text-brand-neutral">
              {copy.footer}
            </Text>
            <Pressable hitSlop={10} onPress={form.toggleMode}>
              <Text className="font-body text-sm font-semibold text-brand-primary">
                {copy.footerAction}
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
