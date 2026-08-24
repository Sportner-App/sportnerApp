import { useRouter } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";

import { AppScreen, Button, Input, ScreenHeader } from "@/components";
import { useToast } from "@/contexts";
import { getApiErrorMessage } from "@/lib/api/errors";
import { createPost } from "@/services/social-service";

export function CreatePostScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!content.trim() || saving) {
      return;
    }
    setSaving(true);
    try {
      const post = await createPost(content.trim());
      showToast({ type: "success", title: "Gönderildi" });
      router.replace(`/posts/${post.id}`);
    } catch (error) {
      showToast({
        type: "error",
        title: "Paylaşılamadı",
        description: getApiErrorMessage(error),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen
      keyboardAvoiding
      header={<ScreenHeader title="YENİ GÖNDERİ" showBack />}
      contentClassName="gap-4 px-6 pt-3"
    >
      <Text className="font-display text-2xl text-white">Ne paylaşmak istersin?</Text>
      <Input
        value={content}
        onChangeText={setContent}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
        style={{ minHeight: 140, paddingTop: 14 }}
        placeholder="Maç, antrenman, davet…"
      />
      <Button label="Paylaş" disabled={!content.trim()} isLoading={saving} onPress={submit} />
    </AppScreen>
  );
}
