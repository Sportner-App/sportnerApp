/**
 * Avatar step component for onboarding
 */

import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { Image, Pressable, Text, TextInput, View } from "react-native";

import { useToast } from "@/shared/ui/toast-provider";

interface AvatarStepProps {
  avatarUrl: string | null;
  bio: string;
  onAvatarChange: (uri: string) => void;
  onBioChange: (text: string) => void;
}

export function AvatarStep({
  avatarUrl,
  bio,
  onAvatarChange,
  onBioChange,
}: AvatarStepProps) {
  const { showToast } = useToast();

  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      showToast({
        type: "error",
        title: "Izin gerekli",
        description: "Profil fotoğrafı için galeri izni vermelisin.",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) {
      return;
    }

    const file = result.assets[0];

    if (file?.uri) {
      const optimizedImage = await ImageManipulator.manipulateAsync(
        file.uri,
        [{ resize: { width: 720, height: 720 } }],
        {
          compress: 0.78,
          format: ImageManipulator.SaveFormat.JPEG,
        },
      );

      onAvatarChange(optimizedImage.uri);
      showToast({
        type: "success",
        title: "Fotoğraf seçildi",
      });
    }
  };

  return (
    <View>
      <Text className="font-display text-xl text-white">Medya ve Bio</Text>
      <Text className="mt-1 font-body text-sm text-brand-neutral">
        Profil fotoğrafı seçip kendini kısa tanıt.
      </Text>

      <View className="mt-4 items-center">
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            className="h-24 w-24 rounded-full"
          />
        ) : (
          <View className="h-24 w-24 items-center justify-center rounded-full border border-brand-tertiary bg-brand-raised">
            <FontAwesome6 name="camera" size={22} color="#ccff00" />
          </View>
        )}

        <Pressable
          onPress={handlePickAvatar}
          style={({ pressed }) =>
            pressed ? { transform: [{ scale: 0.98 }] } : undefined
          }
          className="mt-3 rounded-xl border border-brand-tertiary bg-brand-raised px-4 py-2"
        >
          <Text className="font-body text-sm text-white">Fotoğraf Seç</Text>
        </Pressable>
      </View>

      <TextInput
        value={bio}
        onChangeText={onBioChange}
        placeholder="Kendinden kısaca bahset"
        placeholderTextColor="#64748b"
        multiline
        textAlignVertical="top"
        className="mt-4 min-h-[110px] rounded-2xl border border-brand-tertiary bg-brand-raised px-4 py-3 font-body text-base text-white"
      />
    </View>
  );
}
