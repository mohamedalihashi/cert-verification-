"use client";

import { ConfirmDialog } from "@/components/dialogs";
import { Button, EmptyState } from "@/components/ui";
import { useApp } from "@/lib/store";
import { cn, formatDate, initials, percentChange } from "@/lib/utils";
import {
  Award,
  BookOpen,
  CalendarDays,
  Filter,
  GraduationCap,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

const COURSE_TONES = [
  "bg-sky-100 text-sky-800",
  "bg-violet-100 text-violet-800",
  "bg-orange-100 text-orange-800",
  "bg-emerald-100 text-emerald-800",
  "bg-rose-100 text-rose-800",
  "bg-blue-100 text-blue-900",
];

const AVATAR_TONES = [
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
];

export default function StudentsPage() {
  const { db, courseById, certificatesForStudent, deleteStudent, isSuperAdmin } = useApp();
  const [query, setQuery] = useState("");
  const [courseId, setCourseId] = useState("");
  const [status, setStatus] = useState<"active" | "inactive" | "">("");
  const [year, setYear] = useState("");
  const [joinDate, setJoinDate] = useState("");
  const [applied, setApplied] = useState({
    query: "",
    courseId: "",
    status: "" as "active" | "inactive" | "",
    year: "",
    joinDate: "",
  });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const inMonth = (iso: string, y: number, m: number) => {
    const d = new Date(iso);
    return d.getFullYear() === y && d.getMonth() === m;
  };

  function isActive(studentId: string) {
    const certs = certificatesForStudent(studentId);
    return studentIsActive(certs.length, certs.some((c) => c.status === "valid"));
  }

  const years = useMemo(() => {
    const set = new Set(db.students.map((s) => String(new Date(s.createdAt).getFullYear())));
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [db.students]);

  const thisMonthCount = db.students.filter((s) => inMonth(s.createdAt, thisYear, thisMonth)).length;
  const thisYearCount = db.students.filter((s) => new Date(s.createdAt).getFullYear() === thisYear).length;
  const lastYearCount = db.students.filter((s) => new Date(s.createdAt).getFullYear() === thisYear - 1).length;
  const activeCount = db.students.filter((s) => isActive(s.id)).length;

  const filtered = useMemo(() => {
    const q = applied.query.trim().toLowerCase();
    return db.students.filter((s) => {
      if (applied.courseId && s.courseId !== applied.courseId) return false;
      if (applied.year && String(new Date(s.createdAt).getFullYear()) !== applied.year) return false;
      if (applied.joinDate && s.createdAt.slice(0, 10) !== applied.joinDate) return false;
      if (applied.status === "active" && !isActive(s.id)) return false;
      if (applied.status === "inactive" && isActive(s.id)) return false;
      if (!q) return true;
      return s.fullName.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q);
    });
  }, [applied, db.students, certificatesForStudent]);

  const sorted = [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const pageCount = Math.max(1, Math.ceil(sorted.length / perPage));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * perPage;
  const rows = sorted.slice(start, start + perPage);
  const deleteTarget = db.students.find((s) => s.id === deleteId);

  function applyFilters(e?: React.FormEvent) {
    e?.preventDefault();
    setApplied({ query, courseId, status, year, joinDate });
    setPage(1);
  }

  function reset() {
    setQuery("");
    setCourseId("");
    setStatus("");
    setYear("");
    setJoinDate("");
    setApplied({ query: "", courseId: "", status: "", year: "", joinDate: "" });
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">Students</h1>
          <p className="mt-1 text-sm text-muted">
            Manage student profiles and view their certificate progress.
          </p>
        </div>
        <Link href="/admin/students/new">
          <Button size="lg" className="rounded-full px-6">
            <Plus className="h-4 w-4" />
            Add Student
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat icon={<Users className="h-5 w-5" />} tint="purple" label="Total Students" value={db.students.length} />
        <Stat icon={<UserCheck className="h-5 w-5" />} tint="blue" label="Active Students" value={activeCount} />
        <Stat icon={<Award className="h-5 w-5" />} tint="green" label="Total Certificates" value={db.certificates.length} />
        <Stat icon={<UserPlus className="h-5 w-5" />} tint="orange" label="This Month" value={thisMonthCount} hint="new students" />
        <Stat
          icon={<GraduationCap className="h-5 w-5" />}
          tint="red"
          label="This Year"
          value={thisYearCount}
          hint={`${signed(percentChange(thisYearCount, lastYearCount))} from last year`}
        />
      </div>

      <form onSubmit={applyFilters} className="rounded-2xl border border-line bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_repeat(3,0.75fr)_0.9fr_auto]">
          <label className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or student ID..."
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
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "active" | "inactive" | "")}
            className="h-11 rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-teal"
          >
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
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
          <input
            type="date"
            value={joinDate}
            onChange={(e) => setJoinDate(e.target.value)}
            className="h-11 rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-teal"
            aria-label="Join date"
          />
          <div className="flex gap-2">
            <Button type="button" variant="secondary" className="rounded-xl" onClick={reset}>
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button type="submit" className="rounded-xl">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </div>
      </form>

      {sorted.length === 0 ? (
        <EmptyState title="No students" description="Add a student profile before registering certificates." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead>
                <tr className="bg-[#f4f0ff] text-[11px] font-semibold uppercase tracking-wide text-[#6b5b95]">
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Student ID</th>
                  <th className="px-4 py-3">Course</th>
                  <th className="px-4 py-3">Certificates</th>
                  <th className="px-4 py-3">Join Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s, i) => {
                  const course = courseById(s.courseId);
                  const certCount = certificatesForStudent(s.id).length;
                  const active = isActive(s.id);
                  return (
                    <tr key={s.id} className="border-t border-line/80 hover:bg-[#faf8ff]">
                      <td className="px-4 py-3">
                        <Link href={`/admin/students/${s.id}`} className="inline-flex items-center gap-3">
                          {s.photoDataUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={s.photoDataUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                          ) : (
                            <span
                              className={cn(
                                "grid h-9 w-9 place-items-center rounded-full text-xs font-bold",
                                AVATAR_TONES[i % AVATAR_TONES.length],
                              )}
                            >
                              {initials(s.fullName)}
                            </span>
                          )}
                          <span className="font-medium text-ink">{s.fullName}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted">{s.studentId}</td>
                      <td className="px-4 py-3">
                        {course ? (
                          <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", courseTone(course.name))}>
                            {course.name}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium">{certCount}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatDate(s.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <span className={cn("h-2 w-2 rounded-full", active ? "bg-success" : "bg-danger")} />
                          {active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Link
                            href={`/admin/students/${s.id}/edit`}
                            className="rounded-lg p-2 text-teal hover:bg-sky-50"
                            aria-label="Edit student"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          {isSuperAdmin && (
                            <button
                              type="button"
                              className="rounded-lg p-2 text-danger hover:bg-red-50"
                              onClick={() => setDeleteId(s.id)}
                              aria-label="Delete student"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-line px-4 py-3 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing {sorted.length === 0 ? 0 : start + 1} to {Math.min(start + perPage, sorted.length)} of{" "}
              {sorted.length} students.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2">
                <select
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-9 rounded-lg border border-line bg-white px-2 text-sm"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="h-8 w-8 rounded-lg border border-line disabled:opacity-40"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ‹
                </button>
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className={cn(
                      "h-8 min-w-8 rounded-lg px-2 text-sm",
                      n === safePage ? "bg-teal text-white" : "border border-line hover:bg-cream",
                    )}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  className="h-8 w-8 rounded-lg border border-line disabled:opacity-40"
                  disabled={safePage >= pageCount}
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete student?"
        description="This cannot be undone. Students with certificates cannot be deleted."
        confirmLabel="Delete"
        danger
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteStudent(deleteTarget.id);
          setDeleteId(null);
        }}
      />
    </div>
  );
}

function studentIsActive(certCount: number, hasValid: boolean) {
  if (certCount === 0) return true;
  return hasValid;
}

function signed(n: number) {
  if (n > 0) return `+${n}%`;
  if (n < 0) return `${n}%`;
  return "No change";
}

function courseTone(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash + ch.charCodeAt(0)) % COURSE_TONES.length;
  return COURSE_TONES[hash];
}

function Stat({
  icon,
  tint,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  tint: "purple" | "blue" | "green" | "orange" | "red";
  label: string;
  value: number;
  hint?: string;
}) {
  const tones = {
    purple: "bg-violet-50 text-violet-600",
    blue: "bg-sky-50 text-teal-dark",
    green: "bg-emerald-50 text-success",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-rose-50 text-rose-600",
  };
  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted">{label}</p>
        <span className={cn("grid h-9 w-9 place-items-center rounded-xl", tones[tint])}>{icon}</span>
      </div>
      <p className="mt-2 font-display text-2xl text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
