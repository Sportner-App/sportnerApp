import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

export type PickedMedia = {
  uri: string;
  name: string;
  type: string;
};

export type MediaPickResult = PickedMedia | "denied" | "cancelled";

export type MediaSource = "camera" | "gallery";

export function mediaDeniedMessage(source: MediaSource) {
  return source === "camera"
    ? "Fotoğraf çekmek için kamera izni vermelisin."
    : "Fotoğraf seçmek için galeri izni vermelisin.";
}

function guessVideoType(asset: ImagePicker.ImagePickerAsset): string {
  const mime = asset.mimeType?.toLowerCase();
  if (mime === "video/mp4" || mime === "video/quicktime" || mime === "video/webm") {
    return mime;
  }
  if (asset.uri.toLowerCase().endsWith(".mov")) {
    return "video/quicktime";
  }
  return "video/mp4";
}

function fileName(asset: ImagePicker.ImagePickerAsset, fallback: string) {
  return asset.fileName?.trim() || fallback;
}

function stem(name: string) {
  return name.replace(/\.[^.]+$/, "") || "photo";
}

async function toJpegUpload(asset: ImagePicker.ImagePickerAsset, fallbackName: string): Promise<PickedMedia> {
  const converted = await ImageManipulator.manipulateAsync(asset.uri, [], {
    compress: 0.85,
    format: ImageManipulator.SaveFormat.JPEG,
  });

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

  const result =
    source === "camera"
      ? await ImagePicker.launchCameraAsync({
          ...options,
          allowsMultipleSelection: false,
        })
      : await ImagePicker.launchImageLibraryAsync(options);

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

export async function pickIntroVideo(): Promise<MediaPickResult> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return "denied";
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["videos"],
    videoMaxDuration: 30,
    quality: 0.8,
  });

  if (result.canceled || !result.assets[0]) {
    return "cancelled";
  }

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    name: fileName(asset, "intro.mp4"),
    type: guessVideoType(asset),
  };
}
