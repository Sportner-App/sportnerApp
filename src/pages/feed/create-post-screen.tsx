import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  Pressable,
  useWindowDimensions,
  View,
} from "react-native";
import {
  ScrollView,
  type ScrollView as GestureScrollViewType,
} from "react-native-gesture-handler";

import { AppScreen, Input, ScreenHeader } from "@/components";
import { useToast } from "@/contexts";
import { useMediaSourceChoice } from "@/hooks/use-media-source-choice";
import { getApiErrorMessage } from "@/lib/api/errors";
import { createPost } from "@/services/social-service";
import {
  mediaDeniedMessage,
  pickPostImages,
  type PickedMedia,
} from "@/utils/media-picker";
import { AppText as Text } from "@/components/app-text";

const MAX_PHOTOS = 10;

export function CreatePostScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { t } = useTranslation(["feed", "social"]);
  const { chooseSource, sourceSheet } = useMediaSourceChoice();
  const { width } = useWindowDimensions();
  const previewSize = width - 48; // matches the screen's px-6 (24px) horizontal padding
  const mediaScrollRef = useRef<GestureScrollViewType>(null);
  const [content, setContent] = useState("");
  const [photos, setPhotos] = useState<PickedMedia[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  const canShare = Boolean(content.trim() || photos.length > 0);

  const goToPhoto = (index: number) => {
    setActiveIndex(index);
    mediaScrollRef.current?.scrollTo({
      x: index * previewSize,
      animated: true,
    });
  };

  const choosePhotos = async () => {
    const source = await chooseSource();
    if (!source) {
      return;
    }

    const picked = await pickPostImages(source);
    if (picked === "denied") {
      showToast({
        type: "error",
        title: t("social:toasts.permissionRequired"),
        description: mediaDeniedMessage(source),
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
      return next.slice(0, MAX_PHOTOS);
    });
  };

  const removePhoto = (uri: string) => {
    setPhotos((current) => {
      const next = current.filter((item) => item.uri !== uri);
      setActiveIndex((index) => Math.min(index, Math.max(next.length - 1, 0)));
      return next;
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
        throw new Error(t("feed:create.toasts.createFailedDescription"));
      }
      showToast({ type: "success", title: t("feed:create.toasts.created") });
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)/discover");
      }
    } catch (error) {
      showToast({
        type: "error",
        title: t("feed:create.toasts.createFailed"),
        description: getApiErrorMessage(error),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen
      keyboardAvoiding
      header={
        <ScreenHeader
          title={t("feed:create.header")}
          showBack
          right={
            <Pressable
              hitSlop={8}
              disabled={!canShare || saving}
              onPress={() => void submit()}
              className="min-w-[44px] items-end px-1 py-2"
            >
              {saving ? (
                <ActivityIndicator size="small" color="#ccff00" />
              ) : (
                <Text
                  className={`font-body text-body-sm font-semibold ${
                    canShare ? "text-brand-primary" : "text-brand-neutral"
                  }`}
                >
                  {t("feed:create.share")}
                </Text>
              )}
            </Pressable>
          }
        />
      }
      footer={sourceSheet}
      contentClassName="gap-4 px-6 pt-3"
    >
      {photos.length > 0 ? (
        <View
          className="overflow-hidden rounded-2xl border border-border-default bg-surface-primary"
          style={{ width: previewSize, height: previewSize }}
        >
          <ScrollView
            ref={mediaScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              setActiveIndex(
                Math.round(event.nativeEvent.contentOffset.x / previewSize),
              );
            }}
          >
            {photos.map((photo) => (
              <Image
                key={photo.uri}
                source={{ uri: photo.uri }}
                resizeMode="cover"
                style={{ width: previewSize, height: previewSize }}
              />
            ))}
          </ScrollView>
          {photos.length > 1 ? (
            <View className="absolute right-3 top-3 rounded-pill bg-background-primary/70 px-2.5 py-1">
              <Text className="font-body text-overline font-semibold text-white">
                {activeIndex + 1}/{photos.length}
              </Text>
            </View>
          ) : null}
          <Pressable
            hitSlop={8}
            onPress={() => void choosePhotos()}
            className="absolute bottom-3 right-3 h-10 w-10 items-center justify-center rounded-full bg-background-primary/70 active:opacity-80"
          >
            <FontAwesome6 name="plus" size={14} color="#f8fafc" />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => void choosePhotos()}
          className="aspect-square w-full items-center justify-center gap-3 overflow-hidden rounded-2xl border border-border-default bg-surface-primary px-8"
        >
          <View className="h-14 w-14 items-center justify-center rounded-full bg-brand-primary/15">
            <FontAwesome6 name="camera" size={20} color="#ccff00" />
          </View>
          <Text className="text-center font-body text-body-sm font-semibold text-text-primary">
            {t("feed:create.addPhoto")}
          </Text>
          <Text className="text-center font-body text-caption text-brand-neutral">
            {t("feed:create.photoHint")}
          </Text>
        </Pressable>
      )}

      {photos.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2"
        >
          {photos.map((photo, index) => (
            <Pressable
              key={photo.uri}
              onPress={() => goToPhoto(index)}
              className="relative"
            >
              <Image
                source={{ uri: photo.uri }}
                className={`h-16 w-16 rounded-xl border-2 ${
                  index === activeIndex
                    ? "border-brand-primary"
                    : "border-transparent"
                }`}
              />
              <Pressable
                hitSlop={8}
                onPress={() => removePhoto(photo.uri)}
                className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full bg-background-primary"
              >
                <FontAwesome6 name="xmark" size={9} color="#f8fafc" />
              </Pressable>
            </Pressable>
          ))}
          {photos.length < MAX_PHOTOS ? (
            <Pressable
              onPress={() => void choosePhotos()}
              className="h-16 w-16 items-center justify-center rounded-xl border border-dashed border-border-default active:opacity-70"
            >
              <FontAwesome6 name="plus" size={14} color="#64748b" />
            </Pressable>
          ) : null}
        </ScrollView>
      ) : null}

      <Input
        value={content}
        onChangeText={setContent}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        style={{ minHeight: 72, paddingTop: 14 }}
        placeholder={t("feed:create.placeholder")}
      />
    </AppScreen>
  );
}
