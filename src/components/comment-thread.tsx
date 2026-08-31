import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useToast } from "@/contexts";
import { getApiErrorMessage } from "@/lib/api/errors";
import { listReplies } from "@/services/social-service";
import type { ApiComment } from "@/types/social";

import { Avatar } from "./avatar";

type CommentThreadProps = {
  postId: string;
  comments: ApiComment[];
  onReply: (comment: ApiComment) => void;
  incomingReply?: ApiComment | null;
  onAuthorPress?: (userId: string) => void;
  variant?: "feed" | "detail";
};

export function CommentThread({
  postId,
  comments,
  onReply,
  incomingReply,
  onAuthorPress,
  variant = "feed",
}: CommentThreadProps) {
  const { showToast } = useToast();
  const [repliesByRoot, setRepliesByRoot] = useState<
    Record<string, ApiComment[]>
  >({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loadingRootId, setLoadingRootId] = useState<string | null>(null);
  const processedReplyId = useRef<string | null>(null);

  const loadReplies = async (rootId: string) => {
    setLoadingRootId(rootId);
    try {
      const page = await listReplies(postId, rootId);
      setRepliesByRoot((current) => ({ ...current, [rootId]: page.items }));
    } catch (error) {
      showToast({
        type: "error",
        title: "Yanıtlar yüklenemedi",
        description: getApiErrorMessage(error),
      });
    } finally {
      setLoadingRootId(null);
    }
  };

  useEffect(() => {
    const reply = incomingReply;
    if (!reply?.id || !reply.parentCommentId) {
      return;
    }
    if (processedReplyId.current === reply.id) {
      return;
    }
    processedReplyId.current = reply.id;

    const rootId = reply.parentCommentId;
    setExpanded((current) => ({ ...current, [rootId]: true }));
    setRepliesByRoot((current) => {
      const existing = current[rootId];
      if (!existing) {
        return current;
      }
      if (existing.some((item) => item.id === reply.id)) {
        return current;
      }
      return { ...current, [rootId]: [...existing, reply] };
    });
    if (!repliesByRoot[rootId]) {
      void loadReplies(rootId);
    }
    // repliesByRoot read is snapshot-only for "already loaded?"
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingReply, postId]);

  const toggleReplies = (root: ApiComment) => {
    const isOpen = expanded[root.id];
    if (isOpen) {
      setExpanded((current) => ({ ...current, [root.id]: false }));
      return;
    }
    setExpanded((current) => ({ ...current, [root.id]: true }));
    if (!repliesByRoot[root.id]) {
      void loadReplies(root.id);
    }
  };

  return (
    <View className="gap-3">
      {comments.map((comment) => {
        const count = comment.replyCount;
        const isOpen = Boolean(expanded[comment.id]);
        const replies = repliesByRoot[comment.id] ?? [];
        return (
          <View key={comment.id} className="gap-2">
            <CommentRow
              comment={comment}
              variant={variant}
              onReply={onReply}
              onAuthorPress={onAuthorPress}
            />
            {count > 0 ? (
              <Pressable
                hitSlop={10}
                onPress={() => toggleReplies(comment)}
                className="ml-[40px] flex-row items-center gap-2 self-start py-0.5"
              >
                <View
                  className={`h-px w-6 ${
                    variant === "detail" ? "bg-white/25" : "bg-border-strong"
                  }`}
                />
                <Text
                  className={`font-body text-[11px] font-semibold ${
                    variant === "detail"
                      ? "text-white/50"
                      : "text-text-secondary"
                  }`}
                >
                  {loadingRootId === comment.id
                    ? "Yanıtlar yükleniyor…"
                    : isOpen
                      ? "Yanıtları gizle"
                      : `Yanıtları gör (${count})`}
                </Text>
              </Pressable>
            ) : null}
            {isOpen ? (
              <View className="ml-8 gap-2.5">
                {replies.map((reply) => (
                  <CommentRow
                    key={reply.id}
                    comment={reply}
                    variant={variant}
                    indented
                    onReply={onReply}
                    onAuthorPress={onAuthorPress}
                  />
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function CommentRow({
  comment,
  variant,
  indented = false,
  onReply,
  onAuthorPress,
}: {
  comment: ApiComment;
  variant: "feed" | "detail";
  indented?: boolean;
  onReply: (comment: ApiComment) => void;
  onAuthorPress?: (userId: string) => void;
}) {
  const mention = comment.replyToUsername?.trim();
  const username = comment.username?.trim() || "sporcu";
  const isDetail = variant === "detail";
  const nameColor = isDetail ? "text-white" : "text-text-primary";
  const bodyColor = isDetail ? "text-white" : "text-text-primary";
  const actionColor = isDetail ? "text-white/45" : "text-text-secondary";

  return (
    <View className="flex-row items-start gap-2.5">
      <Pressable
        disabled={!onAuthorPress}
        onPress={onAuthorPress ? () => onAuthorPress(comment.userId) : undefined}
        className="mt-0.5"
      >
        <Avatar
          uri={comment.profileImageUrl}
          name={username}
          size={indented ? 22 : 28}
          borderWidth={0}
        />
      </Pressable>
      <View className="min-w-0 flex-1">
        <Text className={`font-body text-[13px] leading-[18px] ${bodyColor}`}>
          <Text
            className={`font-body-bold ${nameColor}`}
            onPress={
              onAuthorPress ? () => onAuthorPress(comment.userId) : undefined
            }
          >
            {username}{" "}
          </Text>
          {mention ? (
            <Text className="font-body-bold text-brand-primary">
              @{mention}{" "}
            </Text>
          ) : null}
          {comment.content}
        </Text>
        <Pressable
          hitSlop={10}
          onPress={() => onReply(comment)}
          className="mt-0.5 self-start py-0.5"
        >
          <Text className={`font-body text-[11px] font-semibold ${actionColor}`}>
            Yanıtla
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
