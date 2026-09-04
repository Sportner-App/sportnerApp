import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Input, SelectField } from "@/components";
import { ONBOARDING_COPY } from "@/constants/onboarding";
import { useMediaSourceChoice } from "@/hooks/use-media-source-choice";
import { useOnboarding } from "@/hooks/use-onboarding";
import { AnimatedBackground } from "@/pages/auth/animated-background";

import { MediaFields } from "./media-fields";
import { SportsPickerStep } from "./sports-picker-step";

export function OnboardingScreen() {
  const form = useOnboarding();
  const { chooseSource, sourceSheet } = useMediaSourceChoice();
  const insets = useSafeAreaInsets();
  const isSportsStep = form.step === "sports";
  const detailsCopy = ONBOARDING_COPY.details;

  return (
    <View className="flex-1 bg-background-primary">
      <AnimatedBackground />

      {isSportsStep ? (
        <SportsPickerStep form={form} />
      ) : (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="flex-grow px-6 pb-10"
          contentContainerStyle={{ paddingTop: Math.max(insets.top, 16) + 8 }}
        >
          <Animated.View
            entering={FadeInDown.duration(450)}
            className="mb-8 flex-row items-center gap-3"
          >
            <Pressable
              hitSlop={8}
              onPress={() => form.setStep("sports")}
              accessibilityRole="button"
              accessibilityLabel="Spor seçimine dön"
              className="h-11 w-11 items-center justify-center rounded-full border border-border-default bg-surface-primary active:opacity-80"
            >
              <FontAwesome6 name="arrow-left" size={14} color="#ccff00" />
            </Pressable>

            <View className="flex-1 flex-row items-center gap-2.5">
              <View className="h-2.5 w-2.5 rounded-full bg-brand-primary" />
              <Text className="font-mono text-xs tracking-[4px] text-brand-neutral">
                {ONBOARDING_COPY.eyebrow}
              </Text>
            </View>

            <View className="rounded-full border border-brand-primary/25 bg-brand-primary/10 px-3 py-1.5">
              <Text className="font-mono text-[10px] tracking-wide text-brand-primary">
                {detailsCopy.stepLabel}
              </Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(420)}>
            <Text className="font-display text-5xl leading-[52px] text-text-primary">
              {detailsCopy.title}
            </Text>
            <Text className="mt-3 font-body text-base leading-6 text-brand-neutral">
              {detailsCopy.subtitle}
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.duration(500).delay(120)}
            className="mt-8 gap-4 rounded-[28px] border border-border-default bg-surface-primary p-5"
          >
            <MediaFields
              avatar={form.avatar}
              existingAvatarUrl={form.existingAvatarUrl}
              video={form.video}
              onPickAvatar={() => {
                void (async () => {
                  const source = await chooseSource();
                  if (source) {
                    await form.chooseAvatar(source);
                  }
                })();
              }}
              onPickVideo={form.chooseVideo}
              onClearAvatar={form.clearAvatar}
              onClearVideo={form.clearVideo}
            />
            <SelectField
              label="Şehir"
              placeholder={
                form.isCitiesLoading ? "Şehirler yükleniyor..." : "Şehir seç"
              }
              icon="location-dot"
              options={form.cityOptions}
              value={form.city}
              onChange={form.setCity}
              disabled={form.isCitiesLoading || Boolean(form.citiesError)}
              searchable
              searchPlaceholder="Şehir ara"
              sheetTitle="Şehir seç"
              sheetSubtitle="Türkiye'deki 81 ilden birini seç"
            />
            <Input
              label="Bio"
              placeholder="Kısaca kendini anlat (opsiyonel)"
              icon="align-left"
              value={form.bio}
              onChangeText={form.setBio}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{ minHeight: 110, paddingTop: 14 }}
              maxLength={500}
            />
          </Animated.View>

          <Animated.View
            entering={FadeInUp.duration(500).delay(200)}
            className="mt-8 gap-3"
          >
            <Button
              label={detailsCopy.submit}
              size="lg"
              isLoading={form.isSubmitting}
              disabled={form.isSubmitting || !form.canFinish}
              onPress={form.finish}
            />
          </Animated.View>
        </ScrollView>
      )}
      {sourceSheet}
    </View>
  );
}
