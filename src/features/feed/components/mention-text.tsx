import { useRouter } from "expo-router";
import { useMemo } from "react";

import { AppText as Text } from "@/components/app-text";
import type { ApiPostMention } from "@/features/feed/types";

/**
 * Gönderi ve yorum metnini, içindeki etiketleri tıklanabilir yaparak basar.
 *
 * Etiketler sunucuda kimlikle saklanıyor; buradaki eşleştirme metindeki
 * "@jeton" ile saklanan kullanıcı adını karşılaştırıyor. Yazıldığı andaki ad
 * saklandığı için kişi adını sonradan değiştirse metin eski adı gösterir ama
 * dokunulduğunda doğru profile gider.
 *
 * Eşleşmeyen "@bir_sey" yazıları düz metin kalır: kullanıcı elle yazmış
 * olabilir, rastgele bir profile götürmek yanlış olur.
 */
type Segment =
  | { kind: "text"; value: string }
  | { kind: "mention"; value: string; userId: string };

const MENTION_PATTERN = /@([A-Za-z0-9._]{1,30})/g;

export function MentionText({
  content,
  mentions,
  className,
}: {
  content: string;
  /** Eski önbellekten ya da etiket döndürmeyen bir uçtan boş gelebilir. */
  mentions?: ApiPostMention[] | null;
  className?: string;
}) {
  const router = useRouter();

  const segments = useMemo<Segment[]>(() => {
    if (!mentions || mentions.length === 0) {
      return [{ kind: "text", value: content }];
    }

    const byUsername = new Map(
      mentions.map((mention) => [
        mention.username.toLocaleLowerCase("tr"),
        mention.userId,
      ]),
    );

    const parts: Segment[] = [];
    let lastIndex = 0;

    for (const match of content.matchAll(MENTION_PATTERN)) {
      const userId = byUsername.get(match[1].toLocaleLowerCase("tr"));
      if (!userId || match.index === undefined) continue;

      if (match.index > lastIndex) {
        parts.push({
          kind: "text",
          value: content.slice(lastIndex, match.index),
        });
      }

      parts.push({ kind: "mention", value: match[0], userId });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({ kind: "text", value: content.slice(lastIndex) });
    }

    return parts;
  }, [content, mentions]);

  return (
    <Text className={className}>
      {segments.map((segment, index) =>
        segment.kind === "mention" ? (
          <Text
            key={index}
            className="font-body-bold text-brand-primary"
            onPress={() => router.push(`/users/${segment.userId}`)}
          >
            {segment.value}
          </Text>
        ) : (
          segment.value
        ),
      )}
    </Text>
  );
}
