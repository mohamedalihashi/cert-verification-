"use client";

import { PublicBrand } from "@/components/brand";
import { ACADEMY_NAME } from "@/lib/brand";
import { Building2, Shield } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#eef3f8]">
      <header className="border-b border-white/80 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex min-h-[5.25rem] max-w-6xl items-center justify-between gap-4 px-4 py-2">
          <Link href="/" className="shrink-0">
            <PublicBrand compact />
          </Link>
          <nav className="flex items-center gap-1 text-sm font-medium sm:gap-2">
            <Link href="/verify" className="rounded-lg px-3 py-2 text-ink hover:bg-[#eef3f8]">
              Verify
            </Link>
            <Link
              href="/login"
              className="rounded-xl bg-[#1d6fe8] px-4 py-2.5 text-white shadow-sm hover:bg-[#1558c0]"
            >
              Staff login
            </Link>
          </nav>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="border-t border-[#d7e2ee] bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-sm text-muted">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-[#1d6fe8]" />
            For any verification related queries, please contact the academy administration.
          </p>
          <p className="flex items-center gap-2 text-xs text-muted sm:justify-end">
            © <span suppressHydrationWarning>{new Date().getFullYear()}</span> {ACADEMY_NAME}. All
            rights reserved.
            <Building2 className="h-4 w-4 shrink-0 text-[#1d6fe8]" />
          </p>
        </div>
      </footer>
    </div>
  );
}
