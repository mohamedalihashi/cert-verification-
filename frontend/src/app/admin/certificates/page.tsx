"use client";

import { Button, EmptyState, StatusBadge } from "@/components/ui";
import { useApp } from "@/lib/store";
import type { CertificateStatus } from "@/lib/types";
import { cn, formatDate, initials } from "@/lib/utils";
import {
  BookOpen,
  CalendarDays,
  FileText,
  Filter,
  MoreVertical,
  Plus,
  RotateCcw,
  Search,
  Shield,
  User,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const COURSE_TONES = [
  "bg-sky-100 text-sky-800",
  "bg-amber-100 text-amber-800",
  "bg-fuchsia-100 text-fuchsia-800",
  "bg-violet-100 text-violet-800",
  "bg-emerald-100 text-emerald-800",
  "bg-orange-100 text-orange-800",
];

const DOC_TONES = [
  "bg-sky-100 text-sky-600",
  "bg-violet-100 text-violet-600",
  "bg-pink-100 text-pink-600",
  "bg-teal-100 text-teal-700",
  "bg-orange-100 text-orange-600",
];

export default function CertificatesPage() {
  const { db, searchCertificates, studentById, courseById } = useApp();
  const [query, setQuery] = useState("");
  const [courseId, setCourseId] = useState("");
  const [year, setYear] = useState("");
  const [status, setStatus] = useState<CertificateStatus | "">("");
  const [issueDate, setIssueDate] = useState("");
  const [applied, setApplied] = useState({ query: "", courseId: "", year: "", status: "" as CertificateStatus | "", issueDate: "" });
  const [menuId, setMenuId] = useState<string | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) {
      setQuery(q);
      setApplied((prev) => ({ ...prev, query: q }));
    }
  }, []);

  const years = useMemo(() => {
    const set = new Set(db.certificates.map((c) => String(c.graduationYear)));
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [db.certificates]);

  const rows = searchCertificates(applied).sort((a, b) => b.issueDate.localeCompare(a.issueDate));

  function applyFilters(e?: React.FormEvent) {
    e?.preventDefault();
    setApplied({ query, courseId, year, status, issueDate });
    setMenuId(null);
  }

  function reset() {
    setQuery("");
    setCourseId("");
    setYear("");
    setStatus("");
    setIssueDate("");
    setApplied({ query: "", courseId: "", year: "", status: "", issueDate: "" });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div>
            <h1 className="font-display text-3xl text-ink">Certificates</h1>
            <p className="mt-1 text-sm text-muted">
              Search and manage all certificates issued to students.
            </p>
          </div>
          <CertificateHero className="hidden h-20 w-28 shrink-0 sm:block" />
        </div>
        <Link href="/admin/certificates/new">
          <Button size="lg" className="rounded-full px-6">
            <Plus className="h-4 w-4" />
            Add Certificate
          </Button>
        </Link>
      </div>

      <form
        onSubmit={applyFilters}
        className="rounded-2xl border border-line bg-white p-4 shadow-sm"
      >
        <div className="grid gap-3 lg:grid-cols-[1.4fr_repeat(3,0.7fr)_0.85fr_auto]">
          <label className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by certificate number, student name, course..."
              className="h-11 w-full rounded-xl border border-line bg-white pl-10 pr-3 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
            />
          </label>
          <div className="relative">
            <BookOpen className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="h-11 w-full appearance-none rounded-xl border border-line bg-white pl-10 pr-8 text-sm outline-none focus:border-teal"
            >
              <option value="">All courses</option>
              {db.courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="h-11 w-full appearance-none rounded-xl border border-line bg-white pl-10 pr-8 text-sm outline-none focus:border-teal"
            >
              <option value="">All years</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Shield className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CertificateStatus | "")}
              className="h-11 w-full appearance-none rounded-xl border border-line bg-white pl-10 pr-8 text-sm outline-none focus:border-teal"
            >
              <option value="">All statuses</option>
              <option value="valid">Valid</option>
              <option value="revoked">Revoked</option>
              <option value="replaced">Replaced</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <input
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            className="h-11 rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-teal"
          />
          <div className="flex gap-2">
            <Button type="button" variant="secondary" className="rounded-xl" onClick={reset}>
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button type="submit" className="rounded-xl bg-[#7c5cfc] hover:bg-[#6b4ee8]">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </div>
      </form>

      {rows.length === 0 ? (
        <EmptyState title="No certificates" description="Adjust filters or register a new certificate." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead>
                <tr className="bg-[#f4f0ff] text-[11px] font-semibold uppercase tracking-wide text-[#6b5b95]">
                  <th className="px-4 py-3">Certificate Number</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Course</th>
                  <th className="px-4 py-3">Issue Date</th>
                  <th className="px-4 py-3">Year</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c, i) => {
                  const student = studentById(c.studentId);
                  const course = courseById(c.courseId);
                  return (
                    <tr key={c.id} className="border-t border-line/80 hover:bg-[#faf8ff]">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/certificates/${c.id}`}
                          className="inline-flex items-center gap-2 font-mono text-sm text-teal hover:underline"
                        >
                          <span className={cn("grid h-8 w-8 place-items-center rounded-lg", DOC_TONES[i % DOC_TONES.length])}>
                            <FileText className="h-4 w-4" />
                          </span>
                          {c.certificateNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {student ? (
                          <Link href={`/admin/students/${student.id}`} className="inline-flex items-center gap-2">
                            <span className="grid h-8 w-8 place-items-center rounded-full bg-teal/15 text-xs font-bold text-teal-dark">
                              {initials(student.fullName)}
                            </span>
                            <span className="font-medium text-ink">{student.fullName}</span>
                            <User className="h-3.5 w-3.5 text-muted" />
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {course ? (
                          <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", courseTone(course.name))}>
                            {course.name}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-ink">
                          <CalendarDays className="h-3.5 w-3.5 text-muted" />
                          {formatDate(c.issueDate)}
                        </span>
                      </td>
                      <td className="px-4 py-3">{c.graduationYear}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="relative px-4 py-3 text-right">
                        <button
                          type="button"
                          className="rounded-lg p-1.5 text-muted hover:bg-cream"
                          onClick={() => setMenuId(menuId === c.id ? null : c.id)}
                          aria-label="Certificate actions"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {menuId === c.id && (
                          <div className="absolute right-4 z-10 mt-1 w-36 overflow-hidden rounded-xl border border-line bg-white text-left shadow-lg">
                            <Link href={`/admin/certificates/${c.id}`} className="block px-3 py-2 hover:bg-cream">
                              View
                            </Link>
                            <Link href={`/admin/certificates/${c.id}/edit`} className="block px-3 py-2 hover:bg-cream">
                              Edit
                            </Link>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function courseTone(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash + ch.charCodeAt(0)) % COURSE_TONES.length;
  return COURSE_TONES[hash];
}

function CertificateHero({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 100" className={className} aria-hidden>
      <ellipse cx="28" cy="72" rx="22" ry="14" fill="#ddd6fe" />
      <ellipse cx="112" cy="28" rx="20" ry="16" fill="#a5f3fc" />
      <ellipse cx="118" cy="78" rx="16" ry="12" fill="#c4b5fd" />
      <rect x="38" y="18" width="70" height="52" rx="6" fill="#fff" stroke="#c4b5fd" strokeWidth="2" />
      <rect x="48" y="30" width="50" height="4" rx="2" fill="#e9d5ff" />
      <rect x="52" y="40" width="42" height="3" rx="1.5" fill="#ede9fe" />
      <rect x="52" y="48" width="36" height="3" rx="1.5" fill="#ede9fe" />
      <circle cx="73" cy="62" r="7" fill="#fbbf24" />
      <circle cx="73" cy="62" r="3.5" fill="#f59e0b" />
    </svg>
  );
}
