import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from "@microsoft/signalr";

import { apiClient } from "@/lib/api/client";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5139";

export async function connectEventChat(
  conversationId: string,
  onMessage: (message: unknown) => void,
): Promise<HubConnection | null> {
  const token = await apiClient.getToken();
  if (!token) {
    return null;
  }

  const connection = new HubConnectionBuilder()
    .withUrl(`${API_BASE_URL}/hubs/event-chat`, {
      accessTokenFactory: () => token,
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
