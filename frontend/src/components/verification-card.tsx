"use client";

import { PublicBrand } from "@/components/brand";
import type { Certificate, CertificateStatus, Course, Settings, Student } from "@/lib/types";
import { cn, formatDate, statusLabel } from "@/lib/utils";
import {
  Archive,
  Award,
  BookOpen,
  Building2,
  CalendarDays,
  GraduationCap,
  Hash,
  Info,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export function VerificationCard({
  state,
  certificate,
  student,
  course,
  settings,
}: {
  state: "valid" | "revoked" | "not_found" | "unavailable";
  certificate?: Certificate;
  student?: Student;
  course?: Course;
  settings: Settings;
}) {
  if (state === "not_found" || !certificate || !student || !course) {
    return (
      <div className="rounded-[28px] border border-[#d7e2ee] bg-white p-10 text-center shadow-[0_16px_40px_rgba(20,50,90,0.06)]">
        <ShieldX className="mx-auto h-12 w-12 text-muted" />
        <h2 className="mt-4 font-display text-3xl text-ink">Certificate Not Found</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted">
          We could not find a certificate matching this number. Please check the number and try
          again.
        </p>
      </div>
    );
  }

  const status = certificate.status;
  const notice = statusNotice(status, settings.schoolName);

  return (
    <article className="overflow-hidden rounded-[28px] border border-[#d7e2ee] bg-white shadow-[0_16px_40px_rgba(20,50,90,0.08)]">
      <div className="flex justify-center px-6 pt-8">
        <PublicBrand />
      </div>

      {notice ? (
        <div
          className={cn(
            "mx-6 mt-6 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm",
            notice.tone === "danger" && "border-red-200 bg-red-50 text-danger",
            notice.tone === "warn" && "border-amber-200 bg-amber-50 text-warn",
            notice.tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-800",
          )}
        >
          <notice.icon className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            This certificate is <strong>{notice.emphasis}</strong> {notice.rest}
          </p>
        </div>
      ) : null}

      <div className="grid gap-8 px-6 py-8 lg:grid-cols-[200px_1fr] lg:px-8">
        <div className="flex flex-col items-center">
          <div className="overflow-hidden rounded-2xl border-[3px] border-[#d7e2ee] bg-[#f4f7fb] shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={student.photoDataUrl}
              alt={student.fullName}
              className="h-48 w-48 object-cover"
            />
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
            <UserRound className="h-3.5 w-3.5" />
            Student photograph
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-6 sm:gap-x-8">
          <Field icon={UserRound} iconClass="bg-violet-100 text-violet-600" label="Student Name" value={student.fullName} />
          <Field icon={BookOpen} iconClass="bg-sky-100 text-sky-700" label="Course" value={course.name} />
          <Field
            icon={Hash}
            iconClass="bg-emerald-100 text-emerald-700"
            label="Certificate Number"
            value={certificate.certificateNumber}
            mono
          />
          <Field
            icon={CalendarDays}
            iconClass="bg-orange-100 text-orange-600"
            label="Issue Date"
            value={formatDate(certificate.issueDate)}
          />
          <Field
            icon={GraduationCap}
            iconClass="bg-violet-100 text-violet-700"
            label="Graduation Year"
            value={String(certificate.graduationYear)}
          />
          <Field
            icon={statusIcon(status)}
            iconClass={status === "valid" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-danger"}
            label="Status"
            value={statusLabel(status).toUpperCase()}
            valueClass={status === "valid" ? "text-emerald-700" : "text-danger"}
          />
          <Field
            icon={Building2}
            iconClass="bg-sky-100 text-[#1d6fe8]"
            label="Issued By"
            value={settings.schoolName}
          />
          <Field
            icon={Award}
            iconClass="bg-emerald-100 text-emerald-700"
            label="Grade / Result"
            value={certificate.overallResult || "—"}
          />
        </dl>
      </div>

      <Transcript certificate={certificate} course={course} student={student} />

      {notice?.footer ? (
        <div className="mx-6 mb-8 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-danger lg:mx-8">
          <Info className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex flex-1 items-start justify-between gap-4">
            <p>{notice.footer}</p>
            <Archive className="hidden h-10 w-10 shrink-0 text-red-300 sm:block" />
          </div>
        </div>
      ) : null}
    </article>
  );
}

function Transcript({
  certificate,
  course,
  student,
}: {
  certificate: Certificate;
  course: Course;
  student: Student;
}) {
  const rows = certificate.grades.filter((g) => g.subject.trim() || g.result.trim());

  return (
    <section className="border-t border-[#e6eef5] px-6 py-8 lg:px-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-xl text-ink">Academic Transcript</h2>
          <p className="mt-1 text-sm text-muted">
            Subject results recorded for {student.fullName} — {course.name}.
          </p>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-[#d7e2ee]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#f4f7fb] text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="w-14 px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Subject / Module</th>
              <th className="px-4 py-3 font-medium">Grade / Result</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr className="border-t border-[#e6eef5]">
                <td colSpan={3} className="px-4 py-6 text-center text-muted">
                  No subject transcript has been recorded for this certificate.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={row.id} className="border-t border-[#e6eef5] bg-white">
                  <td className="px-4 py-3 font-mono text-muted">{index + 1}</td>
                  <td className="px-4 py-3 font-medium text-ink">{row.subject || "—"}</td>
                  <td className="px-4 py-3 font-semibold text-ink">{row.result || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[#d7e2ee] bg-[#f8fbfd]">
              <td colSpan={2} className="px-4 py-3 font-semibold text-ink">
                Overall result
              </td>
              <td className="px-4 py-3 font-bold text-[#1d6fe8]">
                {certificate.overallResult || "—"}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

function Field({
  icon: Icon,
  iconClass,
  label,
  value,
  valueClass,
  mono,
}: {
  icon: LucideIcon;
  iconClass: string;
  label: string;
  value: string;
  valueClass?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex min-w-0 gap-2 sm:gap-3">
      <span className={cn("mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full", iconClass)}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-muted">{label}</dt>
        <dd className={cn("mt-0.5 break-words font-semibold text-ink", mono && "font-mono text-sm", valueClass)}>
          {value}
        </dd>
      </div>
    </div>
  );
}

function statusIcon(status: CertificateStatus): LucideIcon {
  if (status === "valid") return ShieldCheck;
  if (status === "revoked") return ShieldAlert;
  return Archive;
}

function statusNotice(status: CertificateStatus, schoolName: string) {
  if (status === "valid") {
    return {
      tone: "success" as const,
      icon: ShieldCheck,
      emphasis: "valid",
      rest: `and was issued by ${schoolName}.`,
      footer: null,
    };
  }
  if (status === "revoked") {
    return {
      tone: "danger" as const,
      icon: ShieldAlert,
      emphasis: "revoked",
      rest: "and cannot be used as a valid credential.",
      footer: "Revoked certificates must not be accepted for official verification or use.",
    };
  }
  if (status === "archived") {
    return {
      tone: "danger" as const,
      icon: Archive,
      emphasis: "archived",
      rest: "and cannot be used as a valid credential.",
      footer:
        "Archived certificates are kept for record purposes only and are not valid for official verification or use.",
    };
  }
  if (status === "replaced") {
    return {
      tone: "warn" as const,
      icon: ShieldAlert,
      emphasis: "replaced",
      rest: "and is no longer the official record.",
      footer: "A newer certificate replaced this record. Use the current certificate number instead.",
    };
  }
  return null;
}
