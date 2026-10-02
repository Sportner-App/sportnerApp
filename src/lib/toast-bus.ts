import type { ToastPayload } from "@/types/toast";

type ToastListener = (payload: ToastPayload) => void;

const listeners = new Set<ToastListener>();

export const toastService = {
  show(payload: ToastPayload) {
    listeners.forEach((listener) => listener(payload));
  },

  subscribe(listener: ToastListener) {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },
};

export type { ToastPayload, ToastType } from "@/types/toast";
