import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import {
  AppScreen,
  Button,
  Input,
  SelectField,
  ScreenHeader,
  SportLoader,
} from "@/components";
import { useToast } from "@/contexts";
import { GENDER_OPTIONS } from "@/constants/auth";
import { useMediaSourceChoice } from "@/hooks/use-media-source-choice";
import { useProfile } from "@/hooks/use-profile";
import { useCities } from "@/hooks/use-cities";
import { getApiErrorMessage } from "@/lib/api/errors";
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
  const router = useRouter();
  const { showToast } = useToast();
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
        title: "İzin gerekli",
        description:
          kind === "avatar"
            ? mediaDeniedMessage(source ?? "gallery")
            : "Video seçmek için galeri izni vermelisin.",
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
        showToast({ type: "success", title: "Fotoğraf güncellendi" });
      } else {
        await uploadIntroVideo(picked);
        setVideo(picked);
        showToast({ type: "success", title: "Video güncellendi" });
      }
      await refresh();
    } catch (error) {
      showToast({
        type: "error",
        title: "Yüklenemedi",
        description: getApiErrorMessage(
          error,
          kind === "avatar" ? "Fotoğraf yüklenemedi." : "Video yüklenemedi.",
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
        title: "Ad gerekli",
        description: "Profilinde kullanmak için adını girmelisin.",
      });
      return;
    }

    if (city && !cityOptions.some((option) => option.key === city)) {
      showToast({
        type: "error",
        title: "Şehir seçimi gerekli",
        description: "Lütfen şehir listesinden geçerli bir şehir seç.",
      });
      return;
    }

    const usernameError = validateUsername(username);
    const birthDateError = validateBirthDate(birthDate);
    if (usernameError || birthDateError || !gender) {
      showToast({
        type: "error",
        title: "Bilgileri kontrol et",
        description:
          usernameError ||
          birthDateError ||
          "Lütfen cinsiyet seçimini tamamla.",
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
      showToast({ type: "success", title: "Profil kaydedildi" });
      router.back();
    } catch (error) {
      showToast({
        type: "error",
        title: "Kaydedilemedi",
        description: getApiErrorMessage(error, "Profil güncellenemedi."),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppScreen
      keyboardAvoiding
      header={<ScreenHeader title="DÜZENLE" showBack />}
      footer={sourceSheet}
      contentClassName="gap-5 px-6 pt-2"
    >
      {isLoading || !profile ? (
        <View className="items-center py-16">
          <SportLoader size={120} label="Profil yükleniyor" />
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
              Temel bilgiler
            </Text>
            <Text className="font-body text-xs text-text-tertiary">
              Profilinde seni tanımlayan bilgiler.
            </Text>
          </View>

          <Input
            label="Kullanıcı adı"
            icon="at"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={30}
            disabled={!canChangeUsername}
            helperText={
              canChangeUsername
                ? "Harf, rakam, nokta ve alt çizgi kullanabilirsin."
                : `Tekrar ${formatAvailabilityDate(usernameAvailableAt)} değiştirebilirsin.`
            }
          />
          <Input
            label="Ad"
            value={firstName}
            onChangeText={setFirstName}
            maxLength={50}
            autoCapitalize="words"
          />
          <Input
            label="Soyad"
            value={lastName}
            onChangeText={setLastName}
            maxLength={50}
            autoCapitalize="words"
          />
          <Input
            label="Doğum tarihi"
            icon="calendar-days"
            placeholder="GG.AA.YYYY"
            value={birthDate}
            onChangeText={(value) => setBirthDate(formatBirthDateInput(value))}
            keyboardType="number-pad"
            maxLength={10}
          />
          <SelectField
            label="Cinsiyet"
            placeholder="Cinsiyet seç"
            icon="venus-mars"
            options={GENDER_OPTIONS}
            value={gender}
            onChange={setGender}
            sheetTitle="Cinsiyet"
          />

          <View className="mt-1 gap-1">
            <Text className="font-display text-xl text-text-primary">
              Profil detayları
            </Text>
            <Text className="font-body text-xs text-text-tertiary">
              Topluluğun seni daha kolay tanımasına yardımcı olur.
            </Text>
          </View>
          <SelectField
            label="Şehir"
            placeholder={
              isCitiesLoading ? "Şehirler yükleniyor..." : "Şehir seç"
            }
            icon="location-dot"
            options={cityOptions}
            value={city}
            onChange={setCity}
            disabled={isCitiesLoading || Boolean(citiesError)}
            searchable
            searchPlaceholder="Şehir ara"
            sheetTitle="Şehir seç"
            sheetSubtitle="Türkiye'deki 81 ilden birini seç"
          />
          <Input
            label="Kısa bio"
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
            style={{ minHeight: 110, paddingTop: 14 }}
          />
          <Button label="Kaydet" isLoading={isSaving} onPress={save} />
        </>
      )}
    </AppScreen>
  );
}

const USERNAME_PATTERN = /^[a-zA-Z0-9._]+$/;

function validateUsername(value: string) {
  const username = value.trim();
  if (username.length < 3) return "Kullanıcı adı en az 3 karakter olmalı.";
  if (!USERNAME_PATTERN.test(username)) {
    return "Kullanıcı adı yalnızca harf, rakam, . ve _ içerebilir.";
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
  if (!date) return "Doğum tarihini GG.AA.YYYY formatında gir.";
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
    ? "Yaş 13 ile 120 arasında olmalı."
    : null;
}

function toApiBirthDate(value: string) {
  const [day, month, year] = value.split(".");
  return `${year}-${month}-${day}`;
}

function formatAvailabilityDate(value: Date | null) {
  if (!value || Number.isNaN(value.getTime())) return "daha sonra";
  return value.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
