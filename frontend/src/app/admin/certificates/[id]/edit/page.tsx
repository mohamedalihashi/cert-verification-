"use client";

import { CertificateForm } from "@/components/certificate-form";
import { PageHeader } from "@/components/ui";
import { useApp } from "@/lib/store";
import { useParams } from "next/navigation";
import { Suspense } from "react";

export default function EditCertificatePage() {
  const { id } = useParams<{ id: string }>();
  const { db } = useApp();
  const cert = db.certificates.find((c) => c.id === id);
  if (!cert) return <p className="text-muted">Certificate not found.</p>;
  return (
    <div>
      <PageHeader title="Edit Certificate" description={cert.certificateNumber} />
      <Suspense>
        <CertificateForm certificate={cert} />
      </Suspense>
    </div>
  );
}
