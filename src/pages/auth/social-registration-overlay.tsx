import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";

import { Button, Input } from "@/components";
import type { useSocialAuth } from "@/hooks/use-social-auth";

type Props = { social: ReturnType<typeof useSocialAuth> };

export function SocialRegistrationOverlay({ social }: Props) {
  return (
    <Modal
      visible={Boolean(social.pendingRegistration)}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={social.cancelRegistration}
    >
      <KeyboardAvoidingView
        className="flex-1 bg-background-primary"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="flex-grow justify-center px-6 py-12"
        >
          <Text className="font-display text-4xl text-text-primary">
            Son bir adım.
          </Text>
          <Text className="mt-3 font-body text-base leading-6 text-brand-neutral">
            Kullanıcı adını onayla ve doğum tarihini ekle. Ardından spor
            profilini hazırlayacağız.
          </Text>
          <View className="mt-8 gap-3 rounded-[28px] border border-border-default bg-surface-primary p-5">
            <Input
              icon="at"
              label="Kullanıcı adı"
              value={social.username}
              onChangeText={social.setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              helperText="Senin için ayırdık, istersen değiştirebilirsin"
            />
            <Input
              icon="user"
              label="Ad"
              value={social.firstName}
              onChangeText={social.setFirstName}
              autoCapitalize="words"
            />
            <Input
              icon="user"
              label="Soyad"
              value={social.lastName}
              onChangeText={social.setLastName}
              autoCapitalize="words"
            />
            <Input
              icon="calendar-days"
              label="Doğum tarihi"
              placeholder="GG.AA.YYYY"
              value={social.birthDate}
              onChangeText={social.setBirthDate}
              keyboardType="number-pad"
              maxLength={10}
            />
          </View>
          <View className="mt-6 gap-3">
            <Button
              label="Profili oluştur"
              size="lg"
              onPress={social.completeRegistration}
              isLoading={social.isCompleting}
              disabled={social.isCompleting}
            />
            <Button
              label="Vazgeç"
              variant="ghost"
              onPress={social.cancelRegistration}
              disabled={social.isCompleting}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
