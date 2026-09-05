"use client";

import { Button, Input } from "@/components/ui";
import { ACADEMY_NAME } from "@/lib/brand";
import { Search, ShieldCheck } from "lucide-react";
import type { FormEvent } from "react";

export function VerifyHero({
  value,
  onChange,
  onSubmit,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  error?: string;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-8 pt-10 lg:pt-12">
      <div className="flex items-center gap-2">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">Certificate Verification</h1>
        <ShieldCheck className="h-7 w-7 text-[#1d6fe8]" />
      </div>
      <p className="mt-2 max-w-xl text-sm text-muted sm:text-base">
        Verify the authenticity of certificates issued by {ACADEMY_NAME}.
      </p>
      <form onSubmit={onSubmit} className="mt-6 flex max-w-2xl flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter certificate number"
            className="h-12 rounded-xl border-[#cfdcea] bg-white pl-10 font-mono shadow-sm"
          />
        </div>
        <Button
          type="submit"
          size="lg"
          className="h-12 rounded-xl bg-[#1d6fe8] px-6 hover:bg-[#1558c0]"
        >
          <Search className="h-4 w-4" />
          Verify
        </Button>
      </form>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
    </section>
  );
}
