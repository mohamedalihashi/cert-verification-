"use client";

import { PublicShell } from "@/components/public-shell";
import { VerificationCard } from "@/components/verification-card";
import { VerifyHero } from "@/components/verify-hero";
import { api } from "@/lib/api";
import { ACADEMY_SETTINGS, withAcademyBrand } from "@/lib/brand";
import type { Certificate, Course, Settings, Student } from "@/lib/types";
import { checkVerifyRateLimit, publicVerifyPath } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type VerifyResponse = {
  state: "valid" | "revoked" | "not_found" | "unavailable" | "rate_limited";
  message?: string;
  certificate?: Certificate;
  student?: Student;
  course?: Course;
  settings?: Settings;
};

const fallbackSettings = {
  ...ACADEMY_SETTINGS,
  address: "",
  phone: "",
  email: "",
  website: "",
  publicBaseUrl: "",
  maxCertFileMb: 8,
  maxPhotoMb: 5,
};

export default function VerifyResultPage() {
  const params = useParams<{ certNumber: string }>();
  const number = decodeURIComponent(params.certNumber ?? "");
  const router = useRouter();
  const [nextNumber, setNextNumber] = useState(number);
  const [result, setResult] = useState<VerifyResponse | null>(null);

  useEffect(() => {
    setNextNumber(number);
  }, [number]);

  useEffect(() => {
    let cancelled = false;
    setResult(null);
    api<VerifyResponse>(`/api/public/verify/${encodeURIComponent(number)}`)
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch(() => {
        if (!cancelled) setResult({ state: "not_found" });
      });
    return () => {
      cancelled = true;
    };
  }, [number]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = nextNumber.trim();
    if (!value) return;
    const rate = checkVerifyRateLimit();
    if (!rate.allowed) return;
    router.push(publicVerifyPath(value));
  }

  return (
    <PublicShell>
      <VerifyHero value={nextNumber} onChange={setNextNumber} onSubmit={submit} />
      <div className="mx-auto max-w-6xl px-4 pb-14">
        {!result ? (
          <p className="rounded-[28px] border border-[#d7e2ee] bg-white px-6 py-10 text-center text-sm text-muted shadow-sm">
            Looking up certificate…
          </p>
        ) : result.state === "rate_limited" ? (
          <p className="rounded-[28px] border border-red-200 bg-red-50 px-6 py-8 text-center text-sm text-danger">
            {result.message}
          </p>
        ) : (
          <VerificationCard
            state={result.state === "rate_limited" ? "not_found" : result.state}
            certificate={result.certificate}
            student={result.student}
            course={result.course}
            settings={result.settings ? withAcademyBrand(result.settings) : fallbackSettings}
          />
        )}
      </div>
    </PublicShell>
  );
}
