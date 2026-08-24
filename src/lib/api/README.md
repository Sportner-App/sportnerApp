# API katmanı

Backend iletişiminin altyapısı burada tutulur. Ekran ve hook'lar doğrudan
`apiClient` çağırmamalı; her domain kendi `src/services/*-service.ts`
dosyasını kullanmalıdır.

- `client.ts`: Base URL, timeout, token, GET/POST/PUT/PATCH/DELETE, 401 ve
  servis feedback yönetimi.
- `errors.ts`: Backend, ağ ve HTTP hatalarını tek tip `ApiError` nesnesine
  dönüştürür.
- İstek tipleri (`ApiRequestConfig`, feedback mesajları) `src/types/api.ts`
  içindedir.

## Domain servisi örneği

```ts
export async function updateProfile(payload: UpdateProfilePayload) {
  const response = await apiClient.put<UserProfile>(
    "/api/Profiles/me",
    payload,
    {
      feedback: {
        success: "Profil güncellendi",
        error: {
          title: "Profil güncellenemedi",
          description: "Lütfen bilgileri kontrol edip tekrar deneyin.",
        },
      },
    },
  );

  return response.data;
}
```

`feedback` opsiyoneldir. Arka plandaki GET isteklerinde toast üretmemek için
varsayılan olarak hiçbir mesaj gösterilmez. Hata feedback'i tanımlanmışsa
backend mesajı otomatik olarak açıklama alanına eklenir.

UI özel bir hata akışına ihtiyaç duyduğunda:

```ts
try {
  await serviceCall();
} catch (error) {
  if (isApiError(error) && error.status === 401) {
    // özel yönlendirme
  }
}
```
