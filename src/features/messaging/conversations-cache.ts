import type { ApiConversationListItem } from "@/features/messaging/types";

type ConversationsCache = {
  userId: string;
  events: ApiConversationListItem[];
  friends: ApiConversationListItem[];
};

/**
 * Oturum içi bellek önbelleği (diske yazılmaz). Sohbet listesi ekranı geri
 * dönüldüğünde boş/loader görünmesin diye son listeyi tutar. Anahtar kullanıcı
 * id'si: hesap değişirse başkasının sohbetleri görünmez.
 */
let cache: ConversationsCache | null = null;

export function readConversationsCache(
  userId: string | null | undefined,
): { events: ApiConversationListItem[]; friends: ApiConversationListItem[] } | null {
  if (!userId || !cache) return null;
  if (cache.userId !== userId) {
    cache = null;
    return null;
  }
  return { events: cache.events, friends: cache.friends };
}

export function writeConversationsCache(
  userId: string,
  events: ApiConversationListItem[],
  friends: ApiConversationListItem[],
) {
  cache = { userId, events, friends };
}

export function clearConversationsCache() {
  cache = null;
}
