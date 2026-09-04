import { useEffect, useRef, useState } from "react";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Haptics from "expo-haptics";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Animated, {
  Keyframe,
  LinearTransition,
  withTiming,
  type EntryAnimationsValues,
  type ExitAnimationsValues,
} from "react-native-reanimated";

import {
  BrandMark,
  Button,
  Input,
  SegmentedTabs,
  SelectField,
} from "@/components";
import { AUTH_COPY, AUTH_MODE_OPTIONS, GENDER_OPTIONS } from "@/constants/auth";
import { useAuthForm } from "@/hooks/use-auth-form";
import { useSocialAuth } from "@/hooks/use-social-auth";
import type { AuthMode } from "@/types/auth";

import { AnimatedBackground } from "./animated-background";
import { SocialRegistrationOverlay } from "./social-registration-overlay";

const cardTransition = LinearTransition.duration(220);
const SHIFT = 12;

function fadeUp(duration: number, fromY: number, delay = 0) {
  return new Keyframe({
    0: { opacity: 0, transform: [{ translateY: fromY }] },
    100: { opacity: 1, transform: [{ translateY: 0 }] },
  })
    .duration(duration)
    .delay(delay);
}

function authEntering(shift: number) {
  return (values: EntryAnimationsValues) => {
    "worklet";
    return {
      initialValues: {
        opacity: 0,
        transform: [{ translateX: shift }],
        originX: values.targetOriginX,
        originY: values.targetOriginY,
      },
      animations: {
        opacity: withTiming(1, { duration: 180 }),
        transform: [{ translateX: withTiming(0, { duration: 180 }) }],
      },
    };
  };
}

function authExiting(shift: number) {
  return (values: ExitAnimationsValues) => {
    "worklet";
    return {
      initialValues: {
        opacity: 1,
        transform: [{ translateX: 0 }],
        originX: values.currentOriginX,
        originY: values.currentOriginY,
        width: values.currentWidth,
        height: values.currentHeight,
      },
      animations: {
        opacity: withTiming(0, { duration: 140 }),
        transform: [{ translateX: withTiming(shift, { duration: 140 }) }],
      },
    };
  };
}

export function AuthScreen() {
  const form = useAuthForm();
  const social = useSocialAuth();
  const copy = AUTH_COPY[form.mode];
  const shift = form.isLogin ? -SHIFT : SHIFT;
  const hasMounted = useRef(false);
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);

  useEffect(() => {
    hasMounted.current = true;
  }, []);

  useEffect(() => {
    if (Platform.OS !== "ios") {
      return;
    }
    void AppleAuthentication.isAvailableAsync().then(setIsAppleAvailable);
  }, []);

  const handleModeChange = (mode: AuthMode) => {
    if (mode === form.mode) {
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    form.setMode(mode);
  };

  return (
    <View className="flex-1 bg-background-primary">
      <SocialRegistrationOverlay social={social} />
      <AnimatedBackground />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="flex-grow justify-center px-6 py-14"
        >
          <Animated.View entering={fadeUp(180, 6)} className="mb-10">
            <BrandMark tone="light" />
          </Animated.View>

          <View className="min-h-[140px]">
            <Animated.View
              key={`headline-${form.mode}`}
              entering={
                hasMounted.current ? authEntering(shift) : fadeUp(220, 10, 50)
              }
              exiting={authExiting(shift)}
            >
              <Text className="font-display text-5xl leading-[52px] text-text-primary">
                {copy.title}
              </Text>
              <Text className="mt-3 font-body text-base leading-6 text-brand-neutral">
                {copy.subtitle}
              </Text>
            </Animated.View>
          </View>

          <Animated.View
            entering={fadeUp(240, 12, 100)}
            layout={cardTransition}
            className="mt-9 rounded-[28px] border border-border-default bg-surface-primary p-5"
          >
            <SegmentedTabs
              options={AUTH_MODE_OPTIONS}
              value={form.mode}
              onChange={handleModeChange}
              disabled={form.isLoading}
              indicatorMotion="timing"
            />

            <Animated.View
              key={form.mode}
              entering={hasMounted.current ? authEntering(shift) : undefined}
              exiting={authExiting(shift)}
            >
              <View className="mt-5 gap-3">
                {!form.isLogin && (
                  <>
                    <Input
                      icon="user"
                      placeholder="Ad"
                      value={form.firstName}
                      onChangeText={form.setFirstName}
                      autoCapitalize="words"
                      autoCorrect={false}
                      textContentType="givenName"
                      error={form.fieldErrors.firstName}
                    />
                    <Input
                      icon="user"
                      placeholder="Soyad (opsiyonel)"
                      value={form.lastName}
                      onChangeText={form.setLastName}
                      autoCapitalize="words"
                      autoCorrect={false}
                      textContentType="familyName"
                      error={form.fieldErrors.lastName}
                    />
                    <Input
                      icon="calendar-days"
                      label="Doğum tarihi"
                      placeholder="GG.AA.YYYY"
                      value={form.birthDate}
                      onChangeText={form.setBirthDate}
                      keyboardType="number-pad"
                      maxLength={10}
                      error={form.fieldErrors.birthDate}
                    />
                    <View>
                      <SelectField
                        label="Cinsiyet"
                        placeholder="Cinsiyet seç"
                        icon="venus-mars"
                        options={GENDER_OPTIONS}
                        value={form.gender}
                        onChange={form.setGender}
                      />
                      {form.fieldErrors.gender ? (
                        <Text className="mt-1.5 font-body text-xs text-status-error">
                          {form.fieldErrors.gender}
                        </Text>
                      ) : null}
                    </View>
                  </>
                )}

                <Input
                  icon="at"
                  placeholder="Kullanıcı adı"
                  value={form.username}
                  onChangeText={form.setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username"
                  textContentType="username"
                  helperText={"helper" in copy ? copy.helper : undefined}
                  error={form.fieldErrors.username}
                />
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
                  error={form.fieldErrors.password}
                />
              </View>

              <View className="relative mt-6">
                <Button
                  label={copy.submit}
                  size="lg"
                  isLoading={form.isLoading}
                  disabled={!form.canSubmit || !form.isReady}
                  pressScale={0.98}
                  haptic="light"
                  onPress={form.submit}
                />
                {!form.canSubmit && form.isReady && !form.isLoading ? (
                  <Pressable
                    accessibilityRole="button"
                    className="absolute inset-0"
                    onPress={form.submit}
                  />
                ) : null}
              </View>
            </Animated.View>

            <View className="mt-5 flex-row items-center gap-3">
              <View className="h-px flex-1 bg-border-default" />
              <Text className="font-body text-xs text-brand-neutral">veya</Text>
              <View className="h-px flex-1 bg-border-default" />
            </View>

            <View className="mt-4 gap-3">
              <Button
                label="Google ile devam et"
                variant="secondary"
                size="lg"
                isLoading={social.loadingProvider === "google"}
                disabled={social.loadingProvider !== null}
                onPress={social.signInWithGoogle}
              />
              {isAppleAvailable ? (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={
                    AppleAuthentication.AppleAuthenticationButtonType.CONTINUE
                  }
                  buttonStyle={
                    AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                  }
                  cornerRadius={16}
                  style={{ height: 58 }}
                  onPress={social.signInWithApple}
                />
              ) : null}
            </View>
          </Animated.View>

          <Animated.View
            pointerEvents="none"
            layout={cardTransition}
            className={form.isLogin ? "h-[168px]" : "h-0"}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
