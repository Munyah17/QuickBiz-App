"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";

interface ToastItem {
  id: number;
  message: string;
  tone: "success" | "error";
}

const ToastContext = createContext<{ push: (message: string, tone?: ToastItem["tone"]) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, tone: ToastItem["tone"] = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "flex items-center gap-2 rounded-md border bg-surface px-3 py-2.5 text-sm shadow-popover",
              toast.tone === "success" ? "border-success-500/30 text-success-600" : "border-danger-500/30 text-danger-600"
            )}
          >
            {toast.tone === "success" ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
            <span className="text-text-primary">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
