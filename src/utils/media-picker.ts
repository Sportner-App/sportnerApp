import * as ImagePicker from "expo-image-picker";

export type PickedMedia = {
  uri: string;
  name: string;
  type: string;
};

export type MediaPickResult = PickedMedia | "denied" | "cancelled";

function guessImageType(asset: ImagePicker.ImagePickerAsset): string {
  const mime = asset.mimeType?.toLowerCase();
  if (mime === "image/jpg" || mime === "image/jpeg") {
    return "image/jpeg";
  }
  if (mime === "image/png" || mime === "image/webp") {
    return mime;
  }
  return "image/jpeg";
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

export async function pickProfileImage(): Promise<MediaPickResult> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return "denied";
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled || !result.assets[0]) {
    return "cancelled";
  }

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    name: fileName(asset, "avatar.jpg"),
    type: guessImageType(asset),
  };
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
