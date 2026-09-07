import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import {
  AppScreen,
  Button,
  Input,
  SelectField,
  ScreenHeader,
  SportLoader,
} from "@/components";
import { useToast } from "@/contexts";
import { useGenderOptions } from "@/constants/auth";
import { useMediaSourceChoice } from "@/hooks/use-media-source-choice";
import { useProfile } from "@/hooks/use-profile";
import { useCities } from "@/hooks/use-cities";
import { getApiErrorMessage } from "@/lib/api/errors";
import i18n, { getCurrentLocale } from "@/i18n";
import { MediaFields } from "@/pages/onboarding/media-fields";
import {
  updateBio,
  updateCity,
  updateDisplayName,
  updatePersonalDetails,
  updateUsername,
  uploadAvatar,
  uploadIntroVideo,
} from "@/services/profile-service";
import {
  mediaDeniedMessage,
  pickIntroVideo,
  pickProfileImage,
  type PickedMedia,
} from "@/utils/media-picker";

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
  const [video, setVideo] = useState<PickedMedia | null>(null);
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
    setBirthDate(formatBirthDate(profile.birthDate));
    setAvatar(
      profile.avatarUrl
        ? { uri: profile.avatarUrl, name: "avatar.jpg", type: "image/jpeg" }
        : null,
    );
    setVideo(
      profile.introVideoUrl
        ? { uri: profile.introVideoUrl, name: "intro.mp4", type: "video/mp4" }
        : null,
    );
  }, [profile]);

  const usernameAvailableAt = profile?.usernameChangeAvailableAt
    ? new Date(profile.usernameChangeAvailableAt)
    : null;
  const canChangeUsername =
    !usernameAvailableAt || usernameAvailableAt.getTime() <= Date.now();

  const chooseMedia = async (kind: "avatar" | "video") => {
    const source = kind === "avatar" ? await chooseSource() : "gallery";
    if (kind === "avatar" && !source) {
      return;
    }

    const picked =
      kind === "avatar"
        ? await pickProfileImage(source ?? "gallery")
        : await pickIntroVideo();

    if (picked === "denied") {
      showToast({
        type: "error",
        title: t("profile:edit.permissionRequired"),
        description:
          kind === "avatar"
            ? mediaDeniedMessage(source ?? "gallery")
            : t("profile:edit.videoPermissionRequired"),
      });
      return;
    }

    if (picked === "cancelled") {
      return;
    }

    try {
      if (kind === "avatar") {
        await uploadAvatar(picked);
        setAvatar(picked);
        showToast({ type: "success", title: t("profile:edit.photoUpdated") });
      } else {
        await uploadIntroVideo(picked);
        setVideo(picked);
        showToast({ type: "success", title: t("profile:edit.videoUpdated") });
      }
      await refresh();
    } catch (error) {
      showToast({
        type: "error",
        title: t("profile:edit.uploadFailed"),
        description: getApiErrorMessage(
          error,
          kind === "avatar"
            ? t("profile:edit.photoUploadFailed")
            : t("profile:edit.videoUploadFailed"),
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
    const birthDateError = validateBirthDate(birthDate);
    if (usernameError || birthDateError || !gender) {
      showToast({
        type: "error",
        title: t("profile:edit.checkInfo"),
        description:
          usernameError ||
          birthDateError ||
          t("profile:edit.genderRequired"),
      });
      return;
    }

    setIsSaving(true);
    try {
      if (username.trim().toLowerCase() !== profile?.username) {
        await updateUsername(username.trim().toLowerCase());
      }
      await updateDisplayName(firstName.trim(), lastName.trim() || null);
      await updatePersonalDetails(Number(gender), toApiBirthDate(birthDate));
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
        <View className="items-center py-16">
          <SportLoader size={120} label={t("profile:loading")} />
        </View>
      ) : (
        <>
          <MediaFields
            avatar={avatar}
            video={video}
            onPickAvatar={() => void chooseMedia("avatar")}
            onPickVideo={() => void chooseMedia("video")}
          />

          <View className="gap-1">
            <Text className="font-display text-xl text-text-primary">
              {t("profile:edit.basicInfoTitle")}
            </Text>
            <Text className="font-body text-xs text-text-tertiary">
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
            <Text className="font-display text-xl text-text-primary">
              {t("profile:edit.detailsTitle")}
            </Text>
            <Text className="font-body text-xs text-text-tertiary">
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

const USERNAME_PATTERN = /^[a-zA-Z0-9._]+$/;

function validateUsername(value: string) {
  const username = value.trim();
  if (username.length < 3) {
    return i18n.t("profile:edit.validation.usernameMinLength");
  }
  if (!USERNAME_PATTERN.test(username)) {
    return i18n.t("profile:edit.validation.usernamePattern");
  }
  return null;
}

function formatBirthDate(value: string | null) {
  if (!value) return "";
  const [year, month, day] = value.slice(0, 10).split("-");
  return year && month && day ? `${day}.${month}.${year}` : "";
}

function formatBirthDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
}

function parseBirthDate(value: string) {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const date = new Date(
    Number(match[3]),
    Number(match[2]) - 1,
    Number(match[1]),
  );
  return date.getFullYear() === Number(match[3]) &&
    date.getMonth() === Number(match[2]) - 1 &&
    date.getDate() === Number(match[1])
    ? date
    : null;
}

function validateBirthDate(value: string) {
  const date = parseBirthDate(value);
  if (!date) return i18n.t("profile:edit.validation.birthDateFormat");
  const today = new Date();
  const youngest = new Date(
    today.getFullYear() - 13,
    today.getMonth(),
    today.getDate(),
  );
  const oldest = new Date(
    today.getFullYear() - 120,
    today.getMonth(),
    today.getDate(),
  );
  return date < oldest || date > youngest
    ? i18n.t("profile:edit.validation.birthDateRange")
    : null;
}

function toApiBirthDate(value: string) {
  const [day, month, year] = value.split(".");
  return `${year}-${month}-${day}`;
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
