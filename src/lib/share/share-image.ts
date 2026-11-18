import * as Sharing from "expo-sharing";
import Share, { Social } from "react-native-share";

import { META_APP_ID } from "@/constants/env";
import { palette } from "@/constants/theme";

export type ImageShareTarget = "instagramStory" | "whatsapp" | "other";

/**
 * Hazır bir görseli (yerel dosya) seçilen uygulamaya gönderir.
 *
 * - Instagram: doğrudan hikâye düzenleyicisi açılır, görsel arka plan olarak
 *   yerleşir; kullanıcının yalnızca paylaşa basması kalır. Meta App ID yoksa
 *   ya da Instagram yüklü değilse sistem paylaşım sayfasına düşer.
 * - WhatsApp: Android'de doğrudan sohbet seçimi; iOS'ta WhatsApp'ın kendi
 *   gönderme ekranı.
 * - Diğer: sistem paylaşım sayfası.
 */
export async function shareImage(
  uri: string,
  target: ImageShareTarget,
  dialogTitle: string,
) {
  const fileUri = uri.startsWith("file://") ? uri : `file://${uri}`;

  try {
    if (target === "instagramStory" && META_APP_ID) {
      await Share.shareSingle({
        social: Social.InstagramStories,
        appId: META_APP_ID,
        backgroundImage: fileUri,
        backgroundTopColor: palette.canvas,
        backgroundBottomColor: palette.canvas,
      });
      return;
    }

    if (target === "whatsapp") {
      await Share.shareSingle({
        social: Social.Whatsapp,
        url: fileUri,
        type: "image/png",
        filename: "sportner",
      });
      return;
    }
  } catch (error) {
    // Kullanıcı vazgeçtiyse sessiz kal; uygulama yüklü değilse sistem
    // sayfasına düş.
    if (isUserCancel(error)) {
      return;
    }
  }

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("unavailable");
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: "image/png",
    UTI: "public.png",
    dialogTitle,
  });
}

function isUserCancel(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /cancel|dismiss/i.test(message);
}
