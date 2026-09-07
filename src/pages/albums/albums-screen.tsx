import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("albums");
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
        title: t("toasts.loadFailedTitle"),
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
      header={<ScreenHeader title={t("list.title")} showBack />}
      contentClassName="gap-4 px-6 pt-3"
    >
      {isLoading ? (
        <View className="items-center py-16">
          <SportLoader size={120} label={t("list.loading")} />
        </View>
      ) : (
        <>
          <Input
            label={t("list.newAlbumLabel")}
            value={title}
            onChangeText={setTitle}
            placeholder={t("list.newAlbumPlaceholder")}
          />
          <Button
            label={t("list.create")}
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
                {t("list.photoCount", { count: album.mediaCount })}
              </Text>
            </Pressable>
          ))}
        </>
      )}
    </AppScreen>
  );
}
