import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * Oturum anahtarları (access/refresh token) cihazın güvenli deposunda tutulur:
 * iOS'ta Keychain, Android'de Keystore ile şifrelenen tercihler. AsyncStorage
 * bunları düz metin sakladığı için jailbreak/root'lu cihazlar, cihaz yedekleri
 * ve üçüncü parti paketler okuyabiliyordu.
 *
 * SecureStore yalnızca native platformlarda var; web'de AsyncStorage'a düşülür.
 */

const useSecureStore = Platform.OS !== "web";

export async function getSecureItem(key: string) {
  if (!useSecureStore) {
    return AsyncStorage.getItem(key);
  }

  const value = await SecureStore.getItemAsync(key);

  if (value === null) {
    // Eski sürümler token'ı AsyncStorage'da düz metin tutuyordu. Değeri geri
    // yüklemiyoruz (kullanıcı yeniden giriş yapar) ama kalıntıyı siliyoruz —
    // okunmayan bir token cihazda durmaya devam etmesin.
    await AsyncStorage.removeItem(key);
  }

  return value;
}

export async function setSecureItem(key: string, value: string) {
  if (!useSecureStore) {
    await AsyncStorage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

export async function deleteSecureItem(key: string) {
  if (!useSecureStore) {
    await AsyncStorage.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
  // Geçiş tamamlanmadan çıkış yapan kullanıcılarda eski kopya kalmasın.
  await AsyncStorage.removeItem(key);
}
