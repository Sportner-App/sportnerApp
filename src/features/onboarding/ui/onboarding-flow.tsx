import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Animated from "react-native-reanimated";

import { useAuth } from "@/features/auth/model/auth-context";
import {
  getOnboardingStatus,
  markOnboardingCompleted,
  type SkillLevelsMap,
} from "@/features/onboarding";
import { useOnboardingAnimation } from "@/features/onboarding/model/use-onboarding-animation";
import {
  updateMyProfile,
  uploadProfileAvatar,
} from "@/shared/services/profile-service";
import { useToast } from "@/shared/ui/toast-provider";
import { AvatarStep } from "./avatar-step";
import { DateStep } from "./date-step";
import { SportsStep } from "./sports-step";

function formatDate(date: Date) {
  return date.toISOString().split("T")[0] ?? "";
}

export function OnboardingFlow() {
  const router = useRouter();
  const { showToast } = useToast();
  const { userId, isReady } = useAuth();

  const [step, setStep] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [skillLevels, setSkillLevels] = useState<SkillLevelsMap>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { trackAnimatedStyle } = useOnboardingAnimation(step, viewportWidth);

  const canGoNext = useMemo(() => {
    if (step === 0) {
      return true;
    }

    if (step === 1) {
      return Boolean(birthDate);
    }

    if (step === 2) {
      if (selectedSports.length === 0) {
        return false;
      }

      return selectedSports.every((sport) => Boolean(skillLevels[sport]));
    }

    return true;
  }, [birthDate, selectedSports, skillLevels, step]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!userId) {
      router.replace("/(auth)/login");
      return;
    }

    let active = true;

    getOnboardingStatus(userId)
      .then((response) => {
        if (!active) {
          return;
        }

        if (response.data?.isOnboarded) {
          router.replace("/(tabs)");
        }
      })
      .catch(() => {
        // Handle error silently
      });

    return () => {
      active = false;
    };
  }, [isReady, router, userId]);

  const toggleSport = (sportKey: string) => {
    setSelectedSports((prev) => {
      if (prev.includes(sportKey)) {
        const next = prev.filter((item) => item !== sportKey);

        setSkillLevels((current) => {
          const cloned = { ...current };
          delete cloned[sportKey];
          return cloned;
        });

        return next;
      }

      return [...prev, sportKey];
    });
  };

  const handleDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (event.type === "dismissed") {
      return;
    }

    if (selected) {
      setBirthDate(selected);
    }
  };

  const handleSkip = async () => {
    if (!userId) {
      router.replace("/(auth)/login");
      return;
    }

    setIsSubmitting(true);

    try {
      await markOnboardingCompleted(userId);

      showToast({
        type: "info",
        title: "Onboarding geçildi",
      });

      router.replace("/(tabs)");
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Onboarding gecme islemi tamamlanamadi.";

      showToast({
        type: "error",
        title: "Islem basarisiz",
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (!canGoNext) {
      showToast({
        type: "error",
        title: "Eksik bilgi",
        description:
          step === 1
            ? "Devam etmek için doğum tarihi seçmelisin."
            : "En az 1 spor seçip her biri için seviye belirlemelisin.",
      });
      return;
    }

    if (step < 2) {
      setStep((prev) => prev + 1);
      return;
    }

    if (!userId) {
      router.replace("/(auth)/login");
      return;
    }

    setIsSubmitting(true);

    try {
      // Avatar'ı upload et (eğer varsa)
      let uploadedAvatarUrl = avatarUrl;
      if (avatarUrl) {
        uploadedAvatarUrl = await uploadProfileAvatar(userId, avatarUrl);
      }

      // Profili güncelle
      await updateMyProfile({
        avatarUrl: uploadedAvatarUrl || undefined,
        bio: bio.trim() || undefined,
        birthDate: birthDate ? formatDate(birthDate) : undefined,
        sports: selectedSports,
        skillLevels,
        isOnboarded: true,
      });

      showToast({
        type: "success",
        title: "Profil tamamlandı",
        description: "Sportner ana akışına hoş geldin.",
      });

      router.replace("/(tabs)");
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Profil kaydı tamamlanamadı.";

      showToast({
        type: "error",
        title: "Kayit basarisiz",
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-brand-secondary"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="flex-grow justify-center px-5 py-10"
      >
        <View className="rounded-[32px] border border-brand-tertiary bg-brand-surface px-5 pb-6 pt-5">
          <View className="mb-4 flex-row items-center justify-between">
            <View>
              <Text className="font-display text-3xl text-white">
                Profilini Tamamla
              </Text>
              <Text className="mt-1 font-body text-sm text-brand-neutral">
                Adım {step + 1} / 3
              </Text>
            </View>

            <Pressable
              onPress={handleSkip}
              disabled={isSubmitting}
              style={({ pressed }) =>
                pressed && !isSubmitting
                  ? { transform: [{ scale: 0.98 }] }
                  : undefined
              }
              className="rounded-xl border border-brand-tertiary bg-brand-raised px-3 py-2"
            >
              <Text className="font-body text-xs text-brand-neutral">
                Şimdilik Geç
              </Text>
            </Pressable>
          </View>

          <View className="mb-4 flex-row gap-2">
            {[0, 1, 2].map((index) => (
              <View
                key={index}
                className={`h-1.5 flex-1 rounded-full ${
                  step >= index ? "bg-brand-primary" : "bg-brand-tertiary"
                }`}
              />
            ))}
          </View>

          <View
            className="overflow-hidden"
            onLayout={(event) =>
              setViewportWidth(event.nativeEvent.layout.width)
            }
          >
            <Animated.View
              style={[
                {
                  flexDirection: "row",
                  width: viewportWidth > 0 ? viewportWidth * 3 : undefined,
                },
                trackAnimatedStyle,
              ]}
            >
              <View
                style={{ width: viewportWidth || undefined }}
                className="pr-1"
              >
                <AvatarStep
                  avatarUrl={avatarUrl}
                  bio={bio}
                  onAvatarChange={setAvatarUrl}
                  onBioChange={setBio}
                />
              </View>

              <View
                style={{ width: viewportWidth || undefined }}
                className="px-1"
              >
                <DateStep
                  birthDate={birthDate}
                  showDatePicker={showDatePicker}
                  onDateChange={handleDateChange}
                  onShowDatePickerChange={setShowDatePicker}
                />
              </View>

              <View
                style={{ width: viewportWidth || undefined }}
                className="pl-1"
              >
                <SportsStep
                  selectedSports={selectedSports}
                  skillLevels={skillLevels}
                  onSportToggle={toggleSport}
                  onSkillLevelChange={(sportKey, level) =>
                    setSkillLevels((prev) => ({
                      ...prev,
                      [sportKey]: level as any,
                    }))
                  }
                />
              </View>
            </Animated.View>
          </View>

          <View className="mt-6 flex-row items-center justify-between">
            <Pressable
              onPress={() => setStep((prev) => Math.max(prev - 1, 0))}
              disabled={step === 0 || isSubmitting}
              style={({ pressed }) =>
                pressed && step > 0
                  ? { transform: [{ scale: 0.98 }] }
                  : undefined
              }
              className={`min-h-[52px] min-w-[108px] flex-row items-center justify-center rounded-2xl border px-4 ${
                step === 0
                  ? "border-brand-tertiary bg-brand-raised opacity-50"
                  : "border-brand-tertiary bg-brand-raised"
              }`}
            >
              <FontAwesome6 name="chevron-left" size={16} color="#cbd5e1" />
              <Text className="ml-2 font-body text-sm text-brand-neutral">
                Geri
              </Text>
            </Pressable>

            <Pressable
              onPress={handleNext}
              disabled={isSubmitting}
              style={({ pressed }) =>
                pressed && !isSubmitting
                  ? { transform: [{ scale: 0.98 }] }
                  : undefined
              }
              className="min-h-[52px] min-w-[140px] flex-row items-center justify-center rounded-2xl border border-brand-primary bg-brand-primary px-4"
            >
              {isSubmitting ? (
                <ActivityIndicator color="#0f172a" />
              ) : (
                <>
                  <Text className="font-body text-sm font-semibold text-brand-secondary">
                    {step === 2 ? "Tamamla" : "Devam Et"}
                  </Text>
                  {step === 2 ? (
                    <FontAwesome6
                      name="check"
                      size={16}
                      color="#0f172a"
                      style={{ marginLeft: 6 }}
                    />
                  ) : (
                    <FontAwesome6
                      name="chevron-right"
                      size={16}
                      color="#0f172a"
                      style={{ marginLeft: 6 }}
                    />
                  )}
                </>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
