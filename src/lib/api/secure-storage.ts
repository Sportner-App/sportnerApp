import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * Oturum anahtarları (access/refresh token) cihazın güvenli deposunda tutulur:
 * iOS'ta Keychain, Android'de Keystore ile şifrelenen tercihler. AsyncStorage
 * bunları düz metin sakladığı için jailbreak/root'lu cihazlar, cihaz yedekleri
 * ve üçüncü parti paketler okuyabiliyordu.
 *
 * iOS'ta varsayılan erişilebilirlik WHEN_UNLOCKED: telefon kilitliyken
 * (arka plan görevi, bildirimle uyanma vb.) okuma HATA FIRLATIR. Bu yüzden
 * yeni kayıtlar AFTER_FIRST_UNLOCK ile ve ayrı bir keychainService altında
 * tutulur. Ayrı servis şart: expo-secure-store var olan bir kaydı
 * güncellerken erişilebilirlik özniteliğini DEĞİŞTİRMEZ; aynı yere yazmak
 * eski kaydı taşımaz. Sil-yaz ise arada token'sız bir an bırakır. Eski
 * (servissiz) kayıt ilk okumada yeni servise taşınır.
 */

const IS_IOS = Platform.OS === "ios";
const SERVICE = "sportner.session";

const iosOptions: SecureStore.SecureStoreOptions = {
  keychainService: SERVICE,
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};
// Eski kayıtlar opsiyonsuz (varsayılan servis + WHEN_UNLOCKED) yazılmıştı.
const legacyOptions: SecureStore.SecureStoreOptions | undefined = undefined;

/**
 * Anahtar başına işlem kuyruğu: taşıma sürerken gelen set/delete, eski
 * token'ı geri diriltmesin. Bir işlemin hatası sonrakileri engellemez.
 */
const queues = new Map<string, Promise<unknown>>();

function enqueue<T>(key: string, task: () => Promise<T>): Promise<T> {
  const previous = queues.get(key) ?? Promise.resolve();
  const run = previous.then(task, task);
  const tail = run.catch(() => undefined);
  queues.set(key, tail);
  void tail.then(() => {
    if (queues.get(key) === tail) {
      queues.delete(key);
    }
  });
  return run;
}

async function readItem(key: string) {
  if (!IS_IOS) {
    return SecureStore.getItemAsync(key);
  }

  const current = await SecureStore.getItemAsync(key, iosOptions);
  if (current !== null) {
    return current;
  }

  const legacy = await SecureStore.getItemAsync(key, legacyOptions);
  if (legacy === null) {
    return null;
  }

  try {
    await SecureStore.setItemAsync(key, legacy, iosOptions);
  } catch (error) {
    // Yazma başarısızsa eski kaydı silme; değeri yine de döndür.
    console.warn("Token yeni Keychain servisine taşınamadı:", error);
    return legacy;
  }

  try {
    await SecureStore.deleteItemAsync(key, legacyOptions);
  } catch (error) {
    console.warn("Eski Keychain kaydı silinemedi:", error);
  }

  return legacy;
}

export function getSecureItem(key: string) {
  return enqueue(key, async () => {
    const value = await readItem(key);

    if (value === null) {
      // Eski sürümler token'ı AsyncStorage'da düz metin tutuyordu. Değeri geri
      // yüklemiyoruz (kullanıcı yeniden giriş yapar) ama kalıntıyı siliyoruz —
      // okunmayan bir token cihazda durmaya devam etmesin.
      await AsyncStorage.removeItem(key);
    }

    return value;
  });
}

export function setSecureItem(key: string, value: string) {
  return enqueue(key, async () => {
    if (!IS_IOS) {
      await SecureStore.setItemAsync(key, value);
      return;
    }

    await SecureStore.setItemAsync(key, value, iosOptions);
    try {
      await SecureStore.deleteItemAsync(key, legacyOptions);
    } catch (error) {
      // Eski kopyanın silinememesi yazmayı başarısız saymaz.
      console.warn("Eski Keychain kaydı silinemedi:", error);
    }
  });
}

export function deleteSecureItem(key: string) {
  return enqueue(key, async () => {
    if (IS_IOS) {
      await SecureStore.deleteItemAsync(key, iosOptions);
      await SecureStore.deleteItemAsync(key, legacyOptions);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
    // Geçiş tamamlanmadan çıkış yapan kullanıcılarda eski kopya kalmasın.
    await AsyncStorage.removeItem(key);
  });
}
