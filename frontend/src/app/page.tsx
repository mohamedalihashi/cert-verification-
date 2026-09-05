"use client";

import { PublicShell } from "@/components/public-shell";
import { Button, Input } from "@/components/ui";
import { ACADEMY_NAME, ACADEMY_TAGLINE } from "@/lib/brand";
import { publicVerifyPath } from "@/lib/utils";
import { CheckCircle2, Lock, Search, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const [number, setNumber] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = number.trim();
    if (!value) return;
    router.push(publicVerifyPath(value));
  }

  return (
    <PublicShell>
      <section className="relative overflow-hidden bg-ink text-cream">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,153,229,0.28),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(0,150,94,0.18),transparent_46%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-gold">Achievement through learning</p>
            <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
              Verify a {ACADEMY_NAME} certificate
            </h1>
            <p className="mt-4 max-w-lg text-cream/80">
              {ACADEMY_TAGLINE}. Enter the certificate number printed on the document to
              confirm the student, course, and status.
            </p>
            <form onSubmit={submit} className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
              <Input
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="Enter certificate number, e.g. CILAN-2026-00452"
                className="h-12 bg-white font-mono"
              />
              <Button type="submit" variant="gold" size="lg" className="shrink-0">
                <Search className="h-4 w-4" />
                Verify
              </Button>
            </form>
            <p className="mt-3 text-xs text-cream/60">
              Try the sample number{" "}
              <Link href="/verify/CILAN-2026-00452" className="text-gold underline">
                CILAN-2026-00452
              </Link>
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <p className="font-display text-xl text-gold">What organisations can confirm</p>
            <ul className="mt-5 space-y-4 text-sm text-cream/85">
              <li className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-gold" />
                Student name and photograph from the official student record
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-gold" />
                Course, certificate number, issue date, and graduation year
              </li>
              <li className="flex gap-3">
                <Lock className="mt-0.5 h-4 w-4 text-gold" />
                Private administrative notes are never shown here
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-3xl text-ink">How verification works</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Step n="01" title="Enter the number" body="Use the exact certificate number printed on the Word certificate." />
          <Step n="02" title="Review the result" body="A valid record shows the student photo, course, dates, and status." />
          <Step n="03" title="Confirm identity" body="Match the photograph and details with the person presenting the certificate." />
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-paper p-5">
          <Shield className="h-5 w-5 text-teal" />
          <p className="text-sm text-muted">
            Need the public verification page? Go to{" "}
            <Link href="/verify" className="font-medium text-teal">
              /verify
            </Link>
            . Staff members can{" "}
            <Link href="/login" className="font-medium text-teal">
              sign in
            </Link>{" "}
            to register certificates.
          </p>
        </div>
      </section>
    </PublicShell>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-6">
      <p className="font-mono text-xs tracking-widest text-gold-deep">{n}</p>
      <h3 className="mt-2 font-display text-xl">{title}</h3>
      <p className="mt-2 text-sm text-muted">{body}</p>
    </div>
  );
}
