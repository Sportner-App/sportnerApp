import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from "@microsoft/signalr";

import { API_URL } from "@/constants/env";
import { apiClient } from "@/lib/api/client";

export async function connectEventChat(
  conversationId: string,
  onMessage: (message: unknown) => void,
): Promise<HubConnection | null> {
  const token = await apiClient.getToken();
  if (!token) {
    return null;
  }

  const connection = new HubConnectionBuilder()
    .withUrl(`${API_URL}/hubs/event-chat`, {
      // Erişim anahtarı kısa ömürlü (60 dk); yeniden bağlanırken o anki
      // anahtarı oku, açılıştakini değil.
      accessTokenFactory: async () => (await apiClient.getToken()) ?? token,
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();

  connection.on("MessageCreated", onMessage);
  connection.on("MessageEdited", onMessage);
  connection.on("MessageRedacted", onMessage);
  await connection.start();
  try {
    await connection.invoke("JoinConversation", conversationId);
  } catch (error) {
    // Üye değilse ya da engelliyse açık bağlantı arkada kalmasın.
    await connection.stop().catch(() => undefined);
    throw error;
  }
  return connection;
}

/**
 * Sohbet listesi için kullanıcıya özel bağlantı. Sunucu kimliği doğrulanmış
 * bağlantıyı kullanıcı grubuna kendisi ekler; JoinConversation gerekmez.
 * `ConversationUpdated` önizleme taşımaz: çağıran listeyi yeniden çeker.
 * Eski sunucu olayı hiç göndermez; bu durumda yalnızca bağlantı boşta durur.
 */
export async function connectInbox(
  onUpdated: (conversationId: string) => void,
  onReconnected: () => void,
): Promise<HubConnection | null> {
  const token = await apiClient.getToken();
  if (!token) {
    return null;
  }

  const connection = new HubConnectionBuilder()
    .withUrl(`${API_URL}/hubs/event-chat`, {
      accessTokenFactory: async () => (await apiClient.getToken()) ?? token,
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();

  connection.on("ConversationUpdated", (payload: unknown) => {
    if (typeof payload !== "object" || payload === null) return;
    const conversationId = (payload as { conversationId?: unknown })
      .conversationId;
    if (typeof conversationId !== "string") return;
    onUpdated(conversationId);
  });
  connection.onreconnected(() => onReconnected());
  await connection.start();
  return connection;
}
