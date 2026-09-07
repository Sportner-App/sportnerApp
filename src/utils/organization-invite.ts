import * as Linking from "expo-linking";
import { Platform, Share } from "react-native";

import i18n from "@/i18n";

export function buildOrganizationJoinUrl(inviteCode: string) {
  return Linking.createURL("/organizations/join", {
    scheme: "sportner",
    queryParams: { inviteCode },
  });
}

function inviteShareTitle(organizationName: string) {
  return i18n.t("organizations:invite.shareTitle", { organizationName });
}

/** WhatsApp'ta kodun kolay seçilmesi için kod ayrı satırda. */
export function buildOrganizationInviteShareMessage(
  organizationName: string,
  inviteCode: string,
) {
  const joinUrl = buildOrganizationJoinUrl(inviteCode);

  return [
    i18n.t("organizations:invite.message", { organizationName }),
    "",
    i18n.t("organizations:invite.codeLabel"),
    inviteCode,
    "",
    i18n.t("organizations:invite.howToJoin"),
    joinUrl,
  ].join("\n");
}

export async function shareOrganizationInvite(
  organizationName: string,
  inviteCode: string,
) {
  const message = buildOrganizationInviteShareMessage(organizationName, inviteCode);
  const joinUrl = buildOrganizationJoinUrl(inviteCode);
  const title = inviteShareTitle(organizationName);

  await Share.share(
    Platform.OS === "ios" ? { message, url: joinUrl, title } : { message, title },
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

  await Share.share({ message, title: inviteShareTitle(organizationName) });
}
