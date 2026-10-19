import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  CHAT_BACKGROUND_IDS,
  DEFAULT_CHAT_BACKGROUND,
  DEFAULT_EVENT_CHAT_BACKGROUND,
  type ChatBackgroundId,
} from "@/features/messaging/chat-backgrounds";

/**
 * Sohbet zemini seçimi cihazda tutuluyor, sunucuda değil: duvar kağıdı
 * kişinin kendi ekranına dair bir tercih, karşı tarafı ilgilendirmiyor.
 * WhatsApp ve Telegram da aynı şekilde cihaz başına saklıyor.
 */
function anahtar(conversationId: string) {
  return `sportner:chat-background:${conversationId}`;
}

function gecerliMi(value: string | null): value is ChatBackgroundId {
  return (
    value !== null &&
    (CHAT_BACKGROUND_IDS as readonly string[]).includes(value)
  );
}

export function useChatBackground(
  conversationId: string | null,
  /** Etkinlik sohbeti kapak görseliyle, birebir sohbet desenle açılır. */
  isEventChat = false,
) {
  const [background, setBackground] = useState<ChatBackgroundId>(
    DEFAULT_CHAT_BACKGROUND,
  );

  // Tek yerden karar veriliyor: kayıtlı seçim varsa o, yoksa sohbet türünün
  // varsayılanı. Ayrı bir "tür değişti" etkisi, depodan okunan seçimi sonradan
  // ezebiliyordu — sohbet yanıtı depo okumasından sonra geliyor.
  useEffect(() => {
    if (!conversationId) {
      return;
    }

    let cancelled = false;
    void AsyncStorage.getItem(anahtar(conversationId))
      .then((saved) => {
        if (cancelled) {
          return;
        }
        setBackground(
          gecerliMi(saved)
            ? saved
            : isEventChat
              ? DEFAULT_EVENT_CHAT_BACKGROUND
              : DEFAULT_CHAT_BACKGROUND,
        );
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [conversationId, isEventChat]);

  const chooseBackground = useCallback(
    (next: ChatBackgroundId) => {
      // Önce ekranda değişir: yazma işleminin bitmesini beklemek seçimi
      // dokunuştan sonra geç gösteriyordu.
      setBackground(next);
      if (conversationId) {
        void AsyncStorage.setItem(anahtar(conversationId), next).catch(
          () => undefined,
        );
      }
    },
    [conversationId],
  );

  return { background, chooseBackground };
}
