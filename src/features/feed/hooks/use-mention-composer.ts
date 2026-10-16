import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ApiPostMention } from "@/features/feed/types";
import { searchFriends } from "@/features/social/services/social-service";

/**
 * Seçicide gösterilecek kişi. Hem arkadaş listesi hem sohbet üyesi bu şekli
 * karşılıyor, böylece aynı hook iki bağlamda da kullanılabiliyor.
 */
export type MentionCandidate = {
  userId: string;
  username: string | null;
  firstName: string | null;
  profileImageUrl: string | null;
};

/** İmlecin solunda yazılmakta olan "@jeton" varsa onu döndürür. */
function activeToken(text: string, cursor: number) {
  const upToCursor = text.slice(0, cursor);
  const match = /@([A-Za-z0-9._]{0,30})$/.exec(upToCursor);

  if (!match) return null;

  // "@" bir kelimenin ortasındaysa (ör. e-posta adresi) etiket sayılmaz.
  const charBefore = upToCursor[match.index - 1];
  if (charBefore && !/\s/.test(charBefore)) return null;

  return { query: match[1], start: match.index, end: cursor };
}

const SEARCH_DEBOUNCE_MS = 220;

/**
 * Gönderi yazarken "@" ile arkadaş etiketleme.
 *
 * Etiketler metinden ayrı tutuluyor: sunucu kimlik bekliyor, metindeki yazıyı
 * ise kullanıcı silebiliyor. Gönderim anında yalnızca metinde hâlâ adı geçen
 * etiketler yollanıyor — biri yazdığı etiketi sildiğinde o kişi gönderide adı
 * geçmediği hâlde etiketlenmiş kalmasın.
 */
export function useMentionComposer(
  content: string,
  /**
   * Adayları getiren işlev. Varsayılan arkadaş araması; sohbette bunun yerine
   * sohbet üyeleri veriliyor, çünkü etkinlik grubundakiler arkadaş olmak
   * zorunda değil ve asıl etiketlenmek istenenler tam olarak onlar.
   */
  search: (query: string) => Promise<MentionCandidate[]> = searchFriends,
) {
  const [cursor, setCursor] = useState(0);
  const [selected, setSelected] = useState<ApiPostMention[]>([]);
  const [suggestions, setSuggestions] = useState<MentionCandidate[]>([]);
  const requestRef = useRef(0);

  const token = useMemo(() => activeToken(content, cursor), [content, cursor]);

  useEffect(() => {
    if (!token) {
      setSuggestions([]);
      return;
    }

    const requestId = ++requestRef.current;
    const timer = setTimeout(() => {
      void search(token.query)
        .then((friends) => {
          // Arada gelen eski yanıt yenisini ezmesin.
          if (requestRef.current === requestId) setSuggestions(friends);
        })
        .catch(() => undefined);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [search, token]);

  const apply = useCallback(
    (friend: MentionCandidate) => {
      const username = friend.username;
      if (!token || !username) return null;

      const next =
        content.slice(0, token.start) +
        `@${username} ` +
        content.slice(token.end);

      setSelected((prev) =>
        prev.some((mention) => mention.userId === friend.userId)
          ? prev
          : [...prev, { userId: friend.userId, username }],
      );
      setSuggestions([]);

      return next;
    },
    [content, token],
  );

  /** Metinde hâlâ adı geçen etiketlerin kimlikleri. */
  const mentionedUserIds = useMemo(
    () =>
      selected
        .filter((mention) =>
          new RegExp(`@${mention.username}(?![A-Za-z0-9._])`, "i").test(content),
        )
        .map((mention) => mention.userId),
    [content, selected],
  );

  return {
    suggestions: token ? suggestions : [],
    isPicking: token !== null,
    onSelectionChange: setCursor,
    apply,
    mentionedUserIds,
  };
}
