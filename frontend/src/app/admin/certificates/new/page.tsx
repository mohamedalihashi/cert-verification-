"use client";

import { CertificateForm } from "@/components/certificate-form";
import { PageHeader } from "@/components/ui";
import { Suspense } from "react";

export default function NewCertificatePage() {
  return (
    <div>
      <PageHeader
        title="Add Certificate"
        description="Enter the certificate number exactly as printed. The system will not change it."
      />
      <Suspense>
        <CertificateForm />
      </Suspense>
    </div>
  );
}
