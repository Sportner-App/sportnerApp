import type { AxiosRequestConfig } from "axios";

import type { ToastPayload } from "@/types/toast";

export type ApiFeedbackMessage =
  string | Pick<ToastPayload, "title" | "description" | "durationMs">;

export type ApiRequestConfig<D = unknown> = AxiosRequestConfig<D> & {
  /** 401'de refresh + retry denemesini atla (ör. /auth/refresh'in kendisi) */
  skipAuthRefresh?: boolean;
  /** Aynı isteğin sonsuz retry'ını engeller */
  _retry?: boolean;
  feedback?: {
    success?: ApiFeedbackMessage;
    error?: ApiFeedbackMessage | false;
  };
};

/** Backend'in hata response gövdesi */
export type ApiErrorPayload = {
  code?: string;
  detail?: string;
  error?: string;
  errors?:
    | Record<string, string | string[]>
    | Array<{ code?: string; message?: string; type?: string }>;
  message?: string;
  title?: string;
  status?: number;
};

export type AuthChangeListener = () => void;

export type StoredAuthSession = {
  accessToken: string;
  refreshToken: string;
  user?: Record<string, unknown>;
};

/** Sayfa numaralı liste yanıtı (`?page=&pageSize=`). */
export type PagedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
};

/** Ekranların kullandığı alt küme; servisler eşlenmiş öğelerle döner. */
export type PageSummary<T> = Pick<
  PagedResult<T>,
  "items" | "page" | "totalCount" | "hasNext"
>;

/** İmleç tabanlı liste yanıtı (`?before=&limit=`). */
export type CursorPagedResult<T> = {
  items: T[];
  nextCursor: string | null;
  hasMore?: boolean;
};
