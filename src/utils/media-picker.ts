import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

export type PickedMedia = {
  uri: string;
  name: string;
  type: string;
};

export type MediaPickResult = PickedMedia | "denied" | "cancelled";

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

  return toJpegUpload(result.assets[0], "avatar.jpg");
}

export async function pickPostImages(): Promise<PickedMedia[] | "denied" | "cancelled"> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return "denied";
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: true,
    selectionLimit: 10,
    quality: 0.85,
  });

  if (result.canceled || result.assets.length === 0) {
    return "cancelled";
  }

  return Promise.all(
    result.assets.map((asset, index) => toJpegUpload(asset, `post-${index + 1}.jpg`)),
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
