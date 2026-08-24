export type ToastType = "success" | "error" | "info";

export type ToastPayload = {
  title: string;
  description?: string;
  type?: ToastType;
  durationMs?: number;
};

export type ToastContextValue = {
  showToast: (payload: ToastPayload) => void;
};
