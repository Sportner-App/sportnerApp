import { useLocalSearchParams } from "expo-router";

import { EventChatScreen } from "@/pages/event-chat/event-chat-screen";

export default function ConversationChatRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <EventChatScreen conversationId={id} />;
}
