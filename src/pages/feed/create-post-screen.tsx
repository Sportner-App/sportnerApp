import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";

import { AppScreen, Button, Input, ScreenHeader } from "@/components";
import { useToast } from "@/contexts";
import { getApiErrorMessage } from "@/lib/api/errors";
import { createPost } from "@/services/social-service";
import { pickPostImages, type PickedMedia } from "@/utils/media-picker";

export function CreatePostScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [content, setContent] = useState("");
  const [photos, setPhotos] = useState<PickedMedia[]>([]);
  const [saving, setSaving] = useState(false);

  const canShare = Boolean(content.trim() || photos.length > 0);

  const choosePhotos = async () => {
    const picked = await pickPostImages();
    if (picked === "denied") {
      showToast({
        type: "error",
        title: "İzin gerekli",
        description: "Fotoğraf seçmek için galeri izni vermelisin.",
      });
      return;
    }

    if (picked === "cancelled") {
      return;
    }

    setPhotos((current) => {
      const next = [...current];
      for (const photo of picked) {
        if (!next.some((item) => item.uri === photo.uri)) {
          next.push(photo);
        }
      }
      return next.slice(0, 10);
    });
  };

  const submit = async () => {
    if (!canShare || saving) {
      return;
    }

    setSaving(true);
    try {
      const post = await createPost(content, photos);
      if (!post?.id) {
        throw new Error("Gönderi oluşturulamadı.");
      }
      showToast({ type: "success", title: "Paylaşıldı" });
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)/discover");
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Paylaşılamadı",
        description: getApiErrorMessage(error),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen
      keyboardAvoiding
      header={<ScreenHeader title="YENİ GÖNDERİ" showBack />}
      contentClassName="gap-4 px-6 pt-3"
    >
      <Text className="font-display text-2xl text-text-primary">
        Fotoğrafını paylaş
      </Text>
      <Input
        value={content}
        onChangeText={setContent}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
        style={{ minHeight: 120, paddingTop: 14 }}
        placeholder="Antrenman, maç, anı…"
      />

      <Pressable
        onPress={() => void choosePhotos()}
        className="flex-row items-center gap-3 rounded-2xl border border-border-default bg-surface-primary px-4 py-3.5 active:opacity-80"
      >
        <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-primary/15">
          <FontAwesome6 name="image" size={14} color="#ccff00" />
        </View>
        <View className="flex-1">
          <Text className="font-body text-sm font-semibold text-text-primary">
            Fotoğraf ekle
          </Text>
          <Text className="font-body text-xs text-brand-neutral">
            {photos.length > 0
              ? `${photos.length} fotoğraf seçildi`
              : "En fazla 10 fotoğraf"}
          </Text>
        </View>
        <FontAwesome6 name="plus" size={12} color="#64748b" />
      </Pressable>

      {photos.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {photos.map((photo) => (
            <View key={photo.uri} className="relative">
              <Image
                source={{ uri: photo.uri }}
                className="h-20 w-20 rounded-2xl"
              />
              <Pressable
                hitSlop={8}
                onPress={() =>
                  setPhotos((current) =>
                    current.filter((item) => item.uri !== photo.uri),
                  )
                }
                className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full bg-background-primary"
              >
                <FontAwesome6 name="xmark" size={9} color="#f8fafc" />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <Button
        label="Paylaş"
        disabled={!canShare}
        isLoading={saving}
        onPress={() => void submit()}
      />
    </AppScreen>
  );
}
