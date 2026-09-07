import axios from "axios";

import i18n from "@/i18n";
import type { ApiErrorPayload } from "@/types/api";

function getStatusMessage(status: number) {
  return i18n.t(`api:status.${status}`, {
    defaultValue: i18n.t("api:requestFailed"),
  });
}

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
      (status ? getStatusMessage(status) : undefined)
    );
  }

  return status ? getStatusMessage(status) : undefined;
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
      ? i18n.t("api:networkError")
      : getResponseMessage(data, status) || i18n.t("api:requestFailed");

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
    message: i18n.t("api:unexpectedError"),
    details: error,
  });
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = i18n.t("api:actionFailed"),
) {
  return normalizeApiError(error).message || fallback;
}
