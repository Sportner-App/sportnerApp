import axios from "axios";

import type { ApiErrorPayload } from "@/types/api";

const STATUS_MESSAGES: Record<number, string> = {
  400: "Gönderilen bilgiler geçersiz.",
  401: "Oturum süreniz doldu. Lütfen tekrar giriş yapın.",
  403: "Bu işlem için yetkiniz bulunmuyor.",
  404: "İstenen kayıt bulunamadı.",
  408: "İstek zaman aşımına uğradı.",
  409: "İşlem mevcut verilerle çakışıyor.",
  422: "Gönderilen bilgiler işlenemedi.",
  429: "Çok fazla istek gönderildi. Lütfen biraz bekleyin.",
  500: "Sunucuda beklenmeyen bir hata oluştu.",
  502: "Sunucuya şu anda ulaşılamıyor.",
  503: "Servis geçici olarak kullanılamıyor.",
};

function getValidationMessage(errors: ApiErrorPayload["errors"]) {
  if (!errors) {
    return null;
  }

  const messages = Object.values(errors).flatMap((value) =>
    Array.isArray(value) ? value : [value],
  );

  return messages.length > 0 ? messages.join("\n") : null;
}

function getResponseMessage(data: unknown, status?: number) {
  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (data && typeof data === "object") {
    const payload = data as ApiErrorPayload;
    const validationMessage = getValidationMessage(payload.errors);

    return (
      payload.message ||
      payload.detail ||
      payload.error ||
      validationMessage ||
      payload.title ||
      (status ? STATUS_MESSAGES[status] : undefined)
    );
  }

  return status ? STATUS_MESSAGES[status] : undefined;
}

export class ApiError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly details?: unknown;
  readonly isNetworkError: boolean;

  constructor({
    message,
    status,
    code,
    details,
    isNetworkError = false,
    cause,
  }: {
    message: string;
    status?: number;
    code?: string;
    details?: unknown;
    isNetworkError?: boolean;
    cause?: unknown;
  }) {
    super(message, { cause });
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.isNetworkError = isNetworkError;
  }
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;
    const payload =
      data && typeof data === "object" ? (data as ApiErrorPayload) : undefined;
    const isNetworkError = !error.response;
    const message = isNetworkError
      ? "Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin."
      : getResponseMessage(data, status) || "İstek tamamlanamadı.";

    const nestedCode = Array.isArray(payload?.errors)
      ? (payload.errors as Array<{ code?: string }>).find((item) => item.code)
          ?.code
      : undefined;

    return new ApiError({
      message,
      status,
      code: payload?.code || nestedCode || error.code,
      details: data,
      isNetworkError,
      cause: error,
    });
  }

  if (error instanceof Error) {
    return new ApiError({ message: error.message, cause: error });
  }

  return new ApiError({
    message: "Beklenmeyen bir hata oluştu.",
    details: error,
  });
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "İşlem tamamlanamadı.",
) {
  return normalizeApiError(error).message || fallback;
}
