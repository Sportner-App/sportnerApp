import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

import {
  AppScreen,
  Button,
  Input,
  ScreenHeader,
  SportLoader,
} from "@/components";
import { useToast } from "@/contexts";
import { useProfile } from "@/hooks/use-profile";
import { getApiErrorMessage } from "@/lib/api/errors";
import { MediaFields } from "@/pages/onboarding/media-fields";
import {
  updateBio,
  updateCity,
  updateDisplayName,
  uploadAvatar,
  uploadIntroVideo,
} from "@/services/profile-service";
import {
  pickIntroVideo,
  pickProfileImage,
  type PickedMedia,
} from "@/utils/media-picker";

export function ProfileEditScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { profile, isLoading, refresh } = useProfile();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [avatar, setAvatar] = useState<PickedMedia | null>(null);
  const [video, setVideo] = useState<PickedMedia | null>(null);

  useEffect(() => {
    if (!profile) {
      return;
    }
    setFirstName(profile.firstName);
    setLastName(profile.lastName ?? "");
    setBio(profile.bio ?? "");
    setCity(profile.city ?? "");
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

  const chooseMedia = async (kind: "avatar" | "video") => {
    const picked =
      kind === "avatar" ? await pickProfileImage() : await pickIntroVideo();

    if (picked === "denied") {
      showToast({
        type: "error",
        title: "İzin gerekli",
        description:
          kind === "avatar"
            ? "Fotoğraf seçmek için galeri izni vermelisin."
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
    if (!firstName.trim() || isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      await updateDisplayName(firstName.trim(), lastName.trim() || null);
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

          <Input label="Ad" value={firstName} onChangeText={setFirstName} />
          <Input label="Soyad" value={lastName} onChangeText={setLastName} />
          <Input label="Şehir" value={city} onChangeText={setCity} />
          <Input
            label="Kısa bio"
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={{ minHeight: 110, paddingTop: 14 }}
          />
          <Button label="Kaydet" isLoading={isSaving} onPress={save} />
        </>
      )}
    </AppScreen>
  );
}
