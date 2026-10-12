import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import {
  AppScreen,
  AppText as Text,
  Button,
  Input,
  ScreenHeader,
  ScreenLoader,
  SelectField,
} from "@/components";
import { useToast } from "@/contexts";
import { useGenderOptions } from "@/features/auth/copy";
import { useMediaSourceChoice } from "@/hooks/use-media-source-choice";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { useCities } from "@/features/location/hooks/use-cities";
import { getApiErrorMessage } from "@/lib/api/errors";
import i18n, { getCurrentLocale } from "@/i18n";
import { MediaFields } from "@/components/media-fields";
import {
  updateBio,
  updateCity,
  updateDisplayName,
  updatePersonalDetails,
  updateUsername,
  uploadAvatar,
} from "@/features/profile/services/profile-service";
import {
  mediaDeniedMessage,
  pickProfileImage,
  type PickedMedia,
} from "@/utils/media-picker";
import { USERNAME_MIN_LENGTH, USERNAME_PATTERN } from "@/constants/validation";
import {
  formatBirthDateInput,
  fromApiBirthDate,
  isAllowedBirthDate,
  parseBirthDate,
  toApiBirthDate,
} from "@/utils/birth-date";

export function ProfileEditScreen() {
  const { t } = useTranslation(["profile", "common"]);
  const router = useRouter();
  const { showToast } = useToast();
  const GENDER_OPTIONS = useGenderOptions();
  const { profile, isLoading, refresh } = useProfile();
  const { chooseSource, sourceSheet } = useMediaSourceChoice();
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [avatar, setAvatar] = useState<PickedMedia | null>(null);
  const {
    options: cityOptions,
    isLoading: isCitiesLoading,
    error: citiesError,
  } = useCities();

  useEffect(() => {
    if (!profile) {
      return;
    }
    setUsername(profile.username);
    setFirstName(profile.firstName);
    setLastName(profile.lastName ?? "");
    setBio(profile.bio ?? "");
    setCity(profile.city ?? "");
    setGender(profile.gender == null ? "" : String(profile.gender));
    setBirthDate(fromApiBirthDate(profile.birthDate));
    setAvatar(
      profile.avatarUrl
        ? { uri: profile.avatarUrl, name: "avatar.jpg", type: "image/jpeg" }
        : null,
    );
  }, [profile]);

  const usernameAvailableAt = profile?.usernameChangeAvailableAt
    ? new Date(profile.usernameChangeAvailableAt)
    : null;
  const canChangeUsername =
    !usernameAvailableAt || usernameAvailableAt.getTime() <= Date.now();
  // Age eligibility for events is checked live against birth date, so it can
  // only be set once — otherwise it could be nudged to qualify for an event
  // and reverted afterward. Corrections go through support.
  const isBirthDateLocked = Boolean(profile?.birthDate);

  const chooseAvatar = async () => {
    const source = await chooseSource();
    if (!source) {
      return;
    }

    const picked = await pickProfileImage(source);

    if (picked === "denied") {
      showToast({
        type: "error",
        title: t("profile:edit.permissionRequired"),
        description: mediaDeniedMessage(source),
      });
      return;
    }

    if (picked === "cancelled") {
      return;
    }

    try {
      await uploadAvatar(picked);
      setAvatar(picked);
      showToast({ type: "success", title: t("profile:edit.photoUpdated") });
      await refresh();
    } catch (error) {
      showToast({
        type: "error",
        title: t("profile:edit.uploadFailed"),
        description: getApiErrorMessage(
          error,
          t("profile:edit.photoUploadFailed"),
        ),
      });
    }
  };

  const save = async () => {
    if (isSaving) {
      return;
    }

    if (!firstName.trim()) {
      showToast({
        type: "error",
        title: t("profile:edit.firstNameRequired"),
        description: t("profile:edit.firstNameRequiredDescription"),
      });
      return;
    }

    if (city && !cityOptions.some((option) => option.key === city)) {
      showToast({
        type: "error",
        title: t("profile:edit.cityRequired"),
        description: t("profile:edit.cityRequiredDescription"),
      });
      return;
    }

    const usernameError = validateUsername(username);
    // Gender and birth date are optional (App Store 5.1.1(v)).
    const birthDateError = birthDate.trim() ? validateBirthDate(birthDate) : null;
    if (usernameError || birthDateError) {
      showToast({
        type: "error",
        title: t("profile:edit.checkInfo"),
        description: usernameError || birthDateError || undefined,
      });
      return;
    }

    setIsSaving(true);
    try {
      if (username.trim().toLowerCase() !== profile?.username) {
        await updateUsername(username.trim().toLowerCase());
      }
      await updateDisplayName(firstName.trim(), lastName.trim() || null);
      await updatePersonalDetails(
        gender ? Number(gender) : null,
        birthDate.trim() ? toApiBirthDate(birthDate) : null,
      );
      await updateBio(bio.trim() || null);
      await updateCity(city.trim() || null);
      await refresh();
      showToast({ type: "success", title: t("profile:edit.saved") });
      router.back();
    } catch (error) {
      showToast({
        type: "error",
        title: t("profile:edit.saveFailed"),
        description: getApiErrorMessage(
          error,
          t("profile:edit.saveFailedDescription"),
        ),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppScreen
      keyboardAvoiding
      header={<ScreenHeader title={t("profile:edit.title")} showBack />}
      footer={sourceSheet}
      contentClassName="gap-5 px-6 pt-2"
    >
      {isLoading || !profile ? (
        <ScreenLoader label={t("profile:loading")} />
      ) : (
        <>
          <MediaFields
            avatar={avatar}
            onPickAvatar={() => void chooseAvatar()}
          />

          <View className="gap-1">
            <Text className="font-display text-heading-sm text-text-primary">
              {t("profile:edit.basicInfoTitle")}
            </Text>
            <Text className="font-body text-caption text-text-tertiary">
              {t("profile:edit.basicInfoSubtitle")}
            </Text>
          </View>

          <Input
            label={t("profile:edit.usernameLabel")}
            icon="at"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={30}
            disabled={!canChangeUsername}
            helperText={
              canChangeUsername
                ? t("profile:edit.usernameHelper")
                : t("profile:edit.usernameAvailableAt", {
                    date: formatAvailabilityDate(usernameAvailableAt),
                  })
            }
          />
          <Input
            label={t("profile:edit.firstNameLabel")}
            value={firstName}
            onChangeText={setFirstName}
            maxLength={50}
            autoCapitalize="words"
          />
          <Input
            label={t("profile:edit.lastNameLabel")}
            value={lastName}
            onChangeText={setLastName}
            maxLength={50}
            autoCapitalize="words"
          />
          <Input
            label={t("profile:edit.birthDateLabel")}
            icon="calendar-days"
            placeholder={t("profile:edit.birthDatePlaceholder")}
            value={birthDate}
            onChangeText={(value) => setBirthDate(formatBirthDateInput(value))}
            keyboardType="number-pad"
            maxLength={10}
            disabled={isBirthDateLocked}
            helperText={
              isBirthDateLocked
                ? t("profile:edit.birthDateLocked")
                : t("profile:edit.birthDateHelper")
            }
          />
          <SelectField
            label={t("profile:edit.genderLabel")}
            placeholder={t("profile:edit.genderPlaceholder")}
            icon="venus-mars"
            options={GENDER_OPTIONS}
            value={gender}
            onChange={setGender}
            sheetTitle={t("profile:edit.genderSheetTitle")}
          />

          <View className="mt-1 gap-1">
            <Text className="font-display text-heading-sm text-text-primary">
              {t("profile:edit.detailsTitle")}
            </Text>
            <Text className="font-body text-caption text-text-tertiary">
              {t("profile:edit.detailsSubtitle")}
            </Text>
          </View>
          <SelectField
            label={t("profile:edit.cityLabel")}
            placeholder={
              isCitiesLoading
                ? t("profile:edit.cityLoadingPlaceholder")
                : t("profile:edit.cityPlaceholder")
            }
            icon="location-dot"
            options={cityOptions}
            value={city}
            onChange={setCity}
            disabled={isCitiesLoading || Boolean(citiesError)}
            searchable
            searchPlaceholder={t("profile:edit.citySearchPlaceholder")}
            sheetTitle={t("profile:edit.citySheetTitle")}
            sheetSubtitle={t("profile:edit.citySheetSubtitle")}
          />
          <Input
            label={t("profile:edit.bioLabel")}
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
            style={{ minHeight: 110, paddingTop: 14 }}
          />
          <Button
            label={t("common:save")}
            isLoading={isSaving}
            onPress={save}
          />
        </>
      )}
    </AppScreen>
  );
}

function validateUsername(value: string) {
  const username = value.trim();
  if (username.length < USERNAME_MIN_LENGTH) {
    return i18n.t("profile:edit.validation.usernameMinLength");
  }
  if (!USERNAME_PATTERN.test(username)) {
    return i18n.t("profile:edit.validation.usernamePattern");
  }
  return null;
}

function validateBirthDate(value: string) {
  const date = parseBirthDate(value);
  if (!date) return i18n.t("profile:edit.validation.birthDateFormat");
  return isAllowedBirthDate(date)
    ? null
    : i18n.t("profile:edit.validation.birthDateRange");
}

function formatAvailabilityDate(value: Date | null) {
  if (!value || Number.isNaN(value.getTime())) {
    return i18n.t("profile:edit.usernameAvailableLater");
  }
  return value.toLocaleDateString(getCurrentLocale(), {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
