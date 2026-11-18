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
  await connection.invoke("JoinConversation", conversationId);
  return connection;
}
