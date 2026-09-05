"use client";

import { PublicShell } from "@/components/public-shell";
import { VerifyHero } from "@/components/verify-hero";
import { checkVerifyRateLimit, publicVerifyPath } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function VerifyPage() {
  const router = useRouter();
  const [number, setNumber] = useState("");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = number.trim();
    if (!value) {
      setError("Enter a certificate number.");
      return;
    }
    const rate = checkVerifyRateLimit();
    if (!rate.allowed) {
      setError(rate.message);
      return;
    }
    router.push(publicVerifyPath(value));
  }

  return (
    <PublicShell>
      <VerifyHero value={number} onChange={setNumber} onSubmit={submit} error={error} />
    </PublicShell>
  );
}
