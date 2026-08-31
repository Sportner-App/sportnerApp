import * as Linking from "expo-linking";
import { Platform, Share } from "react-native";

export function buildOrganizationJoinUrl(inviteCode: string) {
  return Linking.createURL("/organizations/join", {
    scheme: "sportner",
    queryParams: { inviteCode },
  });
}

/** WhatsApp'ta kodun kolay seçilmesi için kod ayrı satırda. */
export function buildOrganizationInviteShareMessage(
  organizationName: string,
  inviteCode: string,
) {
  const joinUrl = buildOrganizationJoinUrl(inviteCode);

  return [
    `${organizationName} organizasyonuna Sportner'dan katıl`,
    "",
    "Davet kodu:",
    inviteCode,
    "",
    "Uygulama: Profil → Organizasyonlar → Kod ile katıl",
    joinUrl,
  ].join("\n");
}

export async function shareOrganizationInvite(
  organizationName: string,
  inviteCode: string,
) {
  const message = buildOrganizationInviteShareMessage(organizationName, inviteCode);
  const joinUrl = buildOrganizationJoinUrl(inviteCode);

  await Share.share(
    Platform.OS === "ios"
      ? { message, url: joinUrl, title: `${organizationName} davet kodu` }
      : { message, title: `${organizationName} davet kodu` },
  );
}

export async function shareOrganizationInviteViaWhatsApp(
  organizationName: string,
  inviteCode: string,
) {
  const message = buildOrganizationInviteShareMessage(organizationName, inviteCode);
  const encoded = encodeURIComponent(message);
  const whatsappUrl = `whatsapp://send?text=${encoded}`;
  const webUrl = `https://wa.me/?text=${encoded}`;

  const canOpenWhatsApp = await Linking.canOpenURL(whatsappUrl);
  if (canOpenWhatsApp) {
    await Linking.openURL(whatsappUrl);
    return;
  }

  const canOpenWeb = await Linking.canOpenURL(webUrl);
  if (canOpenWeb) {
    await Linking.openURL(webUrl);
    return;
  }

  await Share.share({ message, title: `${organizationName} davet kodu` });
}
