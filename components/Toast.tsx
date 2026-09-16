"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ToastType = "success" | "error" | "info";

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  const color =
    toast?.type === "success"
      ? "bg-primary text-on-primary"
      : toast?.type === "error"
        ? "bg-error text-on-error"
        : "bg-on-surface text-surface";

  // Nilai context dibuat stabil (showToast sudah useCallback): menampilkan /
  // menyembunyikan toast tidak lagi me-render ulang seluruh konsumen useToast
  // beserta subtree-nya.
  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <div
          className={`fixed bottom-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg font-semibold text-sm ${color}`}
        >
          {toast.message}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
