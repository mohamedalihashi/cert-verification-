"use client";

import { AppProvider, useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import type { ReactNode } from "react";

function Toasts() {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[80] flex w-[min(100%-2rem,22rem)] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex items-start gap-3 rounded-xl border bg-paper px-3 py-3 shadow-lg",
            t.kind === "success" && "border-emerald-200",
            t.kind === "error" && "border-red-200",
            t.kind === "info" && "border-line",
          )}
        >
          {t.kind === "success" && <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />}
          {t.kind === "error" && <XCircle className="mt-0.5 h-4 w-4 text-danger" />}
          {t.kind === "info" && <Info className="mt-0.5 h-4 w-4 text-teal" />}
          <p className="flex-1 text-sm text-ink">{t.message}</p>
          <button type="button" onClick={() => dismissToast(t.id)} className="text-muted hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      {children}
      <Toasts />
    </AppProvider>
  );
}
