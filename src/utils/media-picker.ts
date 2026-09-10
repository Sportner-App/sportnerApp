import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

import i18n from "@/i18n";

export type PickedMedia = {
  uri: string;
  name: string;
  type: string;
};

export type MediaPickResult = PickedMedia | "denied" | "cancelled";

export type MediaSource = "camera" | "gallery";

export function mediaDeniedMessage(source: MediaSource) {
  return source === "camera"
    ? i18n.t("common:media.cameraPermissionDenied")
    : i18n.t("common:media.galleryPermissionDenied");
}

function fileName(asset: ImagePicker.ImagePickerAsset, fallback: string) {
  return asset.fileName?.trim() || fallback;
}

function stem(name: string) {
  return name.replace(/\.[^.]+$/, "") || "photo";
}

/**
 * expo-image-manipulator normalizes EXIF orientation on iOS (including mirrored
 * tags) before any manipulation runs, but on Android its loader only corrects
 * plain rotation (EXIF 3/6/8) — a front-camera selfie's mirror tag (EXIF 2/4)
 * passes straight through, leaving the photo flipped left-right (or up-down)
 * relative to what the user saw. Fix only the confirmed-broken mirror cases
 * here; rotation already works, so we leave it untouched to avoid double-
 * correcting it.
 */
function androidMirrorCorrectionAction(
  exif: Record<string, unknown> | null | undefined,
): ImageManipulator.Action | null {
  if (Platform.OS !== "android") {
    return null;
  }

  const orientation = Number(exif?.Orientation ?? exif?.orientation);

  if (orientation === 2) {
    return { flip: ImageManipulator.FlipType.Horizontal };
  }
  if (orientation === 4) {
    return { flip: ImageManipulator.FlipType.Vertical };
  }

  return null;
}

async function toJpegUpload(
  asset: ImagePicker.ImagePickerAsset,
  fallbackName: string,
): Promise<PickedMedia> {
  const mirrorFix = androidMirrorCorrectionAction(asset.exif);

  const converted = await ImageManipulator.manipulateAsync(
    asset.uri,
    mirrorFix ? [mirrorFix] : [],
    {
      compress: 0.85,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );

  return {
    uri: converted.uri,
    name: `${stem(fileName(asset, fallbackName))}.jpg`,
    type: "image/jpeg",
  };
}

async function requestSourcePermission(source: MediaSource) {
  const permission =
    source === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

  return permission.granted;
}

async function launchImages(
  source: MediaSource,
  options: ImagePicker.ImagePickerOptions,
) {
  if (!(await requestSourcePermission(source))) {
    return "denied" as const;
  }

  // `exif: true` is what lets androidMirrorCorrectionAction read the
  // orientation tag needed to un-mirror front-camera photos on Android.
  const result =
    source === "camera"
      ? await ImagePicker.launchCameraAsync({
          ...options,
          exif: true,
          allowsMultipleSelection: false,
        })
      : await ImagePicker.launchImageLibraryAsync({ ...options, exif: true });

  if (result.canceled || result.assets.length === 0) {
    return "cancelled" as const;
  }

  return result.assets;
}

export async function pickProfileImage(
  source: MediaSource = "gallery",
): Promise<MediaPickResult> {
  const assets = await launchImages(source, {
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (assets === "denied" || assets === "cancelled") {
    return assets;
  }

  const asset = assets[0];
  if (!asset) {
    return "cancelled";
  }

  return toJpegUpload(asset, "avatar.jpg");
}

export async function pickSingleImage(
  source: MediaSource = "gallery",
): Promise<MediaPickResult> {
  const assets = await launchImages(source, {
    mediaTypes: ["images"],
    quality: 0.85,
  });

  if (assets === "denied" || assets === "cancelled") {
    return assets;
  }

  const asset = assets[0];
  if (!asset) {
    return "cancelled";
  }

  return toJpegUpload(asset, "photo.jpg");
}

export async function pickPostImages(
  source: MediaSource = "gallery",
): Promise<PickedMedia[] | "denied" | "cancelled"> {
  const assets = await launchImages(source, {
    mediaTypes: ["images"],
    allowsMultipleSelection: source === "gallery",
    selectionLimit: source === "gallery" ? 10 : 1,
    quality: 0.85,
  });

  if (assets === "denied" || assets === "cancelled") {
    return assets;
  }

  return Promise.all(
    assets.map((asset, index) => toJpegUpload(asset, `post-${index + 1}.jpg`)),
  );
}
