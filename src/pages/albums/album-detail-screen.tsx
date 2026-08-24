import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Text, View } from "react-native";

import { AppScreen, Button, ScreenHeader, SportLoader } from "@/components";
import { useToast } from "@/contexts";
import { getApiErrorMessage } from "@/lib/api/errors";
import { addAlbumMedia, getAlbum } from "@/services/albums-service";
import type { ApiAlbumDetail } from "@/types/social";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5139";

export function AlbumDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showToast } = useToast();
  const [album, setAlbum] = useState<ApiAlbumDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    if (!id) return;
    try {
      setAlbum(await getAlbum(id));
    } catch (error) {
      showToast({
        type: "error",
        title: "Açılamadı",
        description: getApiErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const upload = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted || !id) {
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) {
      return;
    }
    const asset = result.assets[0];
    try {
      await addAlbumMedia(id, {
        uri: asset.uri,
        name: asset.fileName || "photo.jpg",
        type: asset.mimeType || "image/jpeg",
      });
      await load();
    } catch (error) {
      showToast({
        type: "error",
        title: "Yüklenemedi",
        description: getApiErrorMessage(error),
      });
    }
  };

  return (
    <AppScreen
      header={<ScreenHeader title="ALBÜM" showBack />}
      contentClassName="gap-4 px-6 pt-3"
    >
      {isLoading || !album ? (
        <View className="items-center py-16">
          <SportLoader size={120} label="Yükleniyor" />
        </View>
      ) : (
        <>
          <Text className="font-display text-2xl text-white">{album.title}</Text>
          <Button label="Fotoğraf ekle" onPress={upload} />
          <View className="flex-row flex-wrap gap-2">
            {album.media.map((item) => (
              <Image
                key={item.id}
                source={{
                  uri: item.storagePath.startsWith("http")
                    ? item.storagePath
                    : `${API_BASE_URL}/${item.storagePath}`,
                }}
                className="h-28 w-28 rounded-2xl"
              />
            ))}
          </View>
        </>
      )}
    </AppScreen>
  );
}
