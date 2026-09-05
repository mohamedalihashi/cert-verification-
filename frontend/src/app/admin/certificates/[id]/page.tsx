"use client";

import { ConfirmDialog, Modal } from "@/components/dialogs";
import { QrPanel } from "@/components/qr-panel";
import { Button, PageHeader, StatusBadge } from "@/components/ui";
import { useApp } from "@/lib/store";
import {
  copyText,
  formatDate,
  formatDateTime,
  publicVerifyPath,
  publicVerifyUrl,
} from "@/lib/utils";
import { Copy, QrCode } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function CertificateDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const {
    db,
    studentById,
    courseById,
    userById,
    setCertificateStatus,
    deleteCertificate,
    isSuperAdmin,
    toast,
  } = useApp();
  const cert = db.certificates.find((c) => c.id === id);
  const router = useRouter();
  const [qrOpen, setQrOpen] = useState(false);
  const [confirm, setConfirm] = useState<"revoke" | "restore" | "archive" | "delete" | null>(null);

  const origin = useMemo(() => {
    if (db.settings.publicBaseUrl) return db.settings.publicBaseUrl;
    if (typeof window !== "undefined") return window.location.origin;
    return "http://localhost:3000";
  }, [db.settings.publicBaseUrl]);

  if (!cert) return <p className="text-muted">Certificate not found.</p>;
  const student = studentById(cert.studentId);
  const course = courseById(cert.courseId);
  const creator = userById(cert.createdBy);
  const verifyUrl = publicVerifyUrl(origin, cert.certificateNumber);

  return (
    <div>
      <PageHeader
        title={cert.certificateNumber}
        description="Certificate record"
        actions={
          <>
            <Button variant="secondary" onClick={() => setQrOpen(true)}>
              <QrCode className="h-4 w-4" />
              View QR Code
            </Button>
            <Link href={`/admin/certificates/${cert.id}/edit`}>
              <Button variant="secondary">Edit</Button>
            </Link>
            {cert.status === "valid" && (
              <Button variant="danger" onClick={() => setConfirm("revoke")}>
                Revoke
              </Button>
            )}
            {cert.status === "revoked" && (
              <Button onClick={() => setConfirm("restore")}>Restore</Button>
            )}
            {isSuperAdmin && cert.status !== "archived" && (
              <Button variant="secondary" onClick={() => setConfirm("archive")}>
                Archive
              </Button>
            )}
            {isSuperAdmin && (
              <Button variant="danger" onClick={() => setConfirm("delete")}>
                Delete
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <div className="rounded-2xl border border-line bg-paper p-4">
          {student ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={student.photoDataUrl} alt={student.fullName} className="h-48 w-full rounded-xl object-cover" />
              <Link href={`/admin/students/${student.id}`} className="mt-3 block font-medium text-teal hover:underline">
                {student.fullName}
              </Link>
            </>
          ) : (
            <p className="text-sm text-muted">Student missing</p>
          )}
        </div>
        <div className="rounded-2xl border border-line bg-paper p-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Item label="Certificate number" value={cert.certificateNumber} mono />
            <Item label="Course" value={course?.name ?? "—"} />
            <Item label="Issue date" value={formatDate(cert.issueDate)} />
            <Item label="Graduation year" value={String(cert.graduationYear)} />
            <Item label="Grade / result" value={cert.overallResult || "—"} />
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Status</dt>
              <dd className="mt-1">
                <StatusBadge status={cert.status} />
              </dd>
            </div>
            <Item label="Created by" value={creator?.name ?? "—"} />
            <Item label="Created date" value={formatDateTime(cert.createdAt)} />
            <Item label="Last updated" value={formatDateTime(cert.updatedAt)} />
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-muted">Public verification URL</dt>
              <dd className="mt-1 flex flex-wrap items-center gap-2">
                <Link href={publicVerifyPath(cert.certificateNumber)} className="font-mono text-sm text-teal break-all hover:underline">
                  {verifyUrl}
                </Link>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    await copyText(verifyUrl);
                    toast("success", "Verification link copied.");
                  }}
                >
                  <Copy className="h-4 w-4" />
                  Copy verification link
                </Button>
              </dd>
            </div>
          </dl>

          {cert.grades.length > 0 && (
            <div className="mt-6">
              <p className="text-xs uppercase tracking-wide text-muted">Transcript</p>
              <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
                {cert.grades.map((g) => (
                  <li key={g.id} className="flex justify-between px-3 py-2 text-sm">
                    <span>{g.subject}</span>
                    <span className="font-medium">{g.result}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {cert.notes && (
            <div className="mt-6 rounded-xl bg-cream px-4 py-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted">Private notes</p>
              <p className="mt-1">{cert.notes}</p>
            </div>
          )}
        </div>
      </div>

      <Modal open={qrOpen} title="Certificate QR code" onClose={() => setQrOpen(false)}>
        <p className="mb-4 text-sm text-muted">
          Download this QR code and insert it into the Word certificate before printing.
        </p>
        <QrPanel url={verifyUrl} filename={`${cert.certificateNumber}-qr.png`} />
      </Modal>

      <ConfirmDialog
        open={confirm === "revoke"}
        title="Revoke certificate?"
        description="The public verification page will show that this certificate is no longer valid."
        confirmLabel="Revoke"
        danger
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          void setCertificateStatus(cert.id, "revoked", "Certificate revoked");
          setConfirm(null);
        }}
      />
      <ConfirmDialog
        open={confirm === "restore"}
        title="Restore certificate?"
        description="The certificate will be marked valid again."
        confirmLabel="Restore"
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          void setCertificateStatus(cert.id, "valid", "Certificate restored");
          setConfirm(null);
        }}
      />
      <ConfirmDialog
        open={confirm === "archive"}
        title="Archive certificate?"
        description="Archived certificates stay in history but are not publicly valid."
        confirmLabel="Archive"
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          void setCertificateStatus(cert.id, "archived", "Certificate archived");
          setConfirm(null);
        }}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        title="Delete certificate?"
        description="This removes the record from the registry."
        confirmLabel="Delete"
        danger
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          void deleteCertificate(cert.id).then(() => router.push("/admin/certificates"));
          setConfirm(null);
        }}
      />
    </div>
  );
}

function Item({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className={`mt-1 ${mono ? "font-mono text-sm" : "font-medium"}`}>{value}</dd>
    </div>
  );
}
