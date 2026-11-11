import { apiClient } from "@/lib/api/client";

export type AppRelease = {
  /** Boşsa zorunluluk kapalı demektir. */
  minimumVersion: string | null;
  storeUrl: string | null;
};

export async function getAppRelease(platform: string): Promise<AppRelease> {
  const response = await apiClient.get<AppRelease>("/api/app/release", {
    params: { platform },
  });

  return response.data;
}

/**
 * App Store'daki güncel sürüm. Uygulama yalnızca Türkiye mağazasında olduğu
 * için `country=tr` şart: onsuz lookup ABD mağazasına bakıp boş dönüyor.
 *
 * Apple cevabı yaklaşık 23 saat önbelleğe alınabilir diye işaretliyor; `t` ve
 * `no-store` olmadan yeni sürüm bir gün kadar geç görünebiliyor.
 */
export async function getLatestIosRelease(
  bundleId: string,
): Promise<{ version: string; storeUrl: string } | null> {
  const response = await fetch(
    `https://itunes.apple.com/lookup?bundleId=${encodeURIComponent(bundleId)}&country=tr&t=${Date.now()}`,
    { cache: "no-store" },
  );
  const body = (await response.json()) as {
    results?: { version?: string; trackViewUrl?: string }[];
  };
  const result = body.results?.[0];

  if (!result?.version || !result.trackViewUrl) {
    return null;
  }

  return { version: result.version, storeUrl: result.trackViewUrl };
}
