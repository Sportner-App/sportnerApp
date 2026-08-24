import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";

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
import {
  updateBio,
  updateCity,
  updateDisplayName,
  uploadAvatar,
} from "@/services/profile-service";

export function ProfileEditScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { profile, isLoading, refresh } = useProfile();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!profile) {
      return;
    }
    setFirstName(profile.firstName);
    setLastName(profile.lastName ?? "");
    setBio(profile.bio ?? "");
    setCity(profile.city ?? "");
  }, [profile]);

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast({
        type: "error",
        title: "İzin gerekli",
        description: "Fotoğraf seçmek için galeri izni vermelisin.",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const asset = result.assets[0];
    try {
      await uploadAvatar({
        uri: asset.uri,
        name: asset.fileName || "avatar.jpg",
        type: asset.mimeType || "image/jpeg",
      });
      await refresh();
      showToast({ type: "success", title: "Fotoğraf güncellendi" });
    } catch (error) {
      showToast({
        type: "error",
        title: "Yüklenemedi",
        description: getApiErrorMessage(error, "Fotoğraf yüklenemedi."),
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
          <Pressable onPress={pickAvatar} className="items-center gap-2">
            <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-brand-primary/30 bg-brand-primary/15">
              {profile.avatarUrl ? (
                <Image
                  source={{ uri: profile.avatarUrl }}
                  className="h-24 w-24"
                />
              ) : (
                <Text className="font-display text-2xl text-brand-primary">
                  {profile.fullName.slice(0, 1)}
                </Text>
              )}
            </View>
            <Text className="font-body text-xs text-brand-primary">
              Fotoğraf değiştir
            </Text>
          </Pressable>

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
