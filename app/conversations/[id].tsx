import { useLocalSearchParams } from "expo-router";

import { EventChatScreen } from "@/features/messaging/screens/chat-screen";

export default function ConversationChatRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <EventChatScreen conversationId={id} />;
}
