import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import {
  AppScreen,
  Button,
  Input,
  ScreenHeader,
  SportLoader,
} from "@/components";
import { useToast } from "@/contexts";
import { getApiErrorMessage } from "@/lib/api/errors";
import { createAlbum, listMyAlbums } from "@/services/albums-service";
import type { ApiAlbum } from "@/types/social";

export function AlbumsScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [albums, setAlbums] = useState<ApiAlbum[]>([]);
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    try {
      setAlbums(await listMyAlbums());
    } catch (error) {
      showToast({
        type: "error",
        title: "Yüklenemedi",
        description: getApiErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppScreen
      header={<ScreenHeader title="ALBÜMLER" showBack />}
      contentClassName="gap-4 px-6 pt-3"
    >
      {isLoading ? (
        <View className="items-center py-16">
          <SportLoader size={120} label="Yükleniyor" />
        </View>
      ) : (
        <>
          <Input
            label="Yeni albüm"
            value={title}
            onChangeText={setTitle}
            placeholder="Örn. Halı saha 2026"
          />
          <Button
            label="Albüm oluştur"
            disabled={!title.trim()}
            onPress={async () => {
              await createAlbum(title.trim());
              setTitle("");
              await load();
            }}
          />
          {albums.map((album) => (
            <Pressable
              key={album.id}
              onPress={() => router.push(`/albums/${album.id}`)}
              className="rounded-2xl border border-border-default bg-surface-primary p-4"
            >
              <Text className="font-body text-sm font-semibold text-text-primary">
                {album.title}
              </Text>
              <Text className="font-body text-xs text-brand-neutral">
                {album.mediaCount} fotoğraf
              </Text>
            </Pressable>
          ))}
        </>
      )}
    </AppScreen>
  );
}
