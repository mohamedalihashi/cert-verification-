"use client";

import { ConfirmDialog, Modal } from "@/components/dialogs";
import { Button, EmptyState, StatusBadge } from "@/components/ui";
import { useApp } from "@/lib/store";
import type { Course, CourseStatus } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import {
  BookMarked,
  BookOpen,
  Briefcase,
  Calculator,
  CalendarDays,
  Code2,
  Eye,
  Filter,
  FlaskConical,
  GraduationCap,
  HeartPulse,
  Languages,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

export default function CoursesPage() {
  const { db, updateCourse } = useApp();
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState<CourseStatus | "">("");
  const [sort, setSort] = useState<"latest" | "name" | "code">("latest");
  const [updatedOn, setUpdatedOn] = useState("");
  const [applied, setApplied] = useState({
    query: "",
    department: "",
    status: "" as CourseStatus | "",
    sort: "latest" as "latest" | "name" | "code",
    updatedOn: "",
  });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [viewCourse, setViewCourse] = useState<Course | null>(null);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const activeCount = db.courses.filter((c) => c.status === "active").length;
  const updatedThisMonth = db.courses.filter((c) => {
    const d = new Date(c.updatedAt);
    return d.getFullYear() === thisYear && d.getMonth() === thisMonth;
  }).length;

  const departments = useMemo(() => {
    return [...new Set(db.courses.map((c) => c.department).filter(Boolean))].sort();
  }, [db.courses]);

  const filtered = useMemo(() => {
    const q = applied.query.trim().toLowerCase();
    let rows = db.courses.filter((c) => {
      if (applied.department && c.department !== applied.department) return false;
      if (applied.status && c.status !== applied.status) return false;
      if (applied.updatedOn && c.updatedAt.slice(0, 10) !== applied.updatedOn) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.department.toLowerCase().includes(q)
      );
    });
    rows = [...rows].sort((a, b) => {
      if (applied.sort === "name") return a.name.localeCompare(b.name);
      if (applied.sort === "code") return a.code.localeCompare(b.code);
      return b.updatedAt.localeCompare(a.updatedAt);
    });
    return rows;
  }, [applied, db.courses]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * perPage;
  const rows = filtered.slice(start, start + perPage);
  const deactivateTarget = db.courses.find((c) => c.id === deactivateId);

  function applyFilters(e?: React.FormEvent) {
    e?.preventDefault();
    setApplied({ query, department, status, sort, updatedOn });
    setPage(1);
  }

  function reset() {
    setQuery("");
    setDepartment("");
    setStatus("");
    setSort("latest");
    setUpdatedOn("");
    setApplied({ query: "", department: "", status: "", sort: "latest", updatedOn: "" });
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-display text-3xl text-ink">
            <BookOpen className="h-7 w-7 text-[#7c5cfc]" />
            Courses
          </h1>
          <p className="mt-1 text-sm text-muted">Manage all courses and track their status.</p>
        </div>
        <Link href="/admin/courses/new">
          <Button size="lg" className="rounded-full bg-[#7c5cfc] px-6 hover:bg-[#6b4ee8]">
            <Plus className="h-4 w-4" />
            Add Course
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={<BookOpen className="h-5 w-5" />} tint="purple" label="Total Courses" value={db.courses.length} />
        <Stat
          icon={<BookMarked className="h-5 w-5" />}
          tint="blue"
          label="Active Courses"
          value={activeCount}
          hint={db.courses.length ? `${Math.round((activeCount / db.courses.length) * 100)}% active` : "0% active"}
        />
        <Stat icon={<GraduationCap className="h-5 w-5" />} tint="green" label="Total Certificates" value={db.certificates.length} />
        <Stat icon={<CalendarDays className="h-5 w-5" />} tint="orange" label="Updated This Month" value={updatedThisMonth} />
      </div>

      <form onSubmit={applyFilters} className="rounded-2xl border border-line bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_repeat(3,0.75fr)_0.95fr_auto]">
          <label className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by course name or code..."
              className="h-11 w-full rounded-xl border border-line bg-white pl-10 pr-3 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
            />
          </label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="h-11 rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-teal"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as CourseStatus | "")}
            className="h-11 rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-teal"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "latest" | "name" | "code")}
            className="h-11 rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-teal"
          >
            <option value="latest">Sort by: Latest</option>
            <option value="name">Sort by: Name</option>
            <option value="code">Sort by: Code</option>
          </select>
          <input
            type="date"
            value={updatedOn}
            onChange={(e) => setUpdatedOn(e.target.value)}
            className="h-11 rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-teal"
            aria-label="Updated date"
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

      {filtered.length === 0 ? (
        <EmptyState title="No courses" description="Add a course before registering student certificates." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead>
                <tr className="bg-[#f4f0ff] text-[11px] font-semibold uppercase tracking-wide text-[#6b5b95]">
                  <th className="px-4 py-3">Course</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="border-t border-line/80 hover:bg-[#faf8ff]">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setViewCourse(c)}
                        className="inline-flex items-center gap-3 text-left"
                      >
                        <span className={cn("grid h-9 w-9 place-items-center rounded-xl", courseIconTone(c.name))}>
                          {courseIcon(c.name)}
                        </span>
                        <span className="font-medium text-ink">{c.name}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-muted">{c.code}</td>
                    <td className="px-4 py-3">{c.department}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                        <CalendarDays className="h-3.5 w-3.5 text-[#7c5cfc]" />
                        {formatDate(c.updatedAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          className="rounded-lg p-2 text-teal hover:bg-sky-50"
                          onClick={() => setViewCourse(c)}
                          aria-label="View course"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <Link
                          href={`/admin/courses/${c.id}/edit`}
                          className="rounded-lg p-2 text-teal hover:bg-sky-50"
                          aria-label="Edit course"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          className="rounded-lg p-2 text-danger hover:bg-red-50"
                          onClick={() => setDeactivateId(c.id)}
                          aria-label="Deactivate course"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-line px-4 py-3 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing {filtered.length === 0 ? 0 : start + 1} to {Math.min(start + perPage, filtered.length)} of{" "}
              {filtered.length} courses.
            </p>
            <div className="flex flex-wrap items-center gap-3">
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
                      n === safePage ? "bg-[#7c5cfc] text-white" : "border border-line hover:bg-cream",
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

      <Modal open={Boolean(viewCourse)} title={viewCourse?.name ?? "Course"} onClose={() => setViewCourse(null)}>
        {viewCourse && (
          <dl className="space-y-3 text-sm">
            <Row label="Code" value={viewCourse.code} />
            <Row label="Department" value={viewCourse.department} />
            <Row label="Status" value={viewCourse.status} />
            <Row label="Updated" value={formatDate(viewCourse.updatedAt)} />
            <Row
              label="Certificates"
              value={String(db.certificates.filter((cert) => cert.courseId === viewCourse.id).length)}
            />
            {viewCourse.description && <Row label="Description" value={viewCourse.description} />}
            <div className="pt-2">
              <Link href={`/admin/courses/${viewCourse.id}/edit`}>
                <Button>Edit course</Button>
              </Link>
            </div>
          </dl>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deactivateTarget)}
        title={deactivateTarget?.status === "inactive" ? "Course already inactive" : "Deactivate course?"}
        description={
          deactivateTarget?.status === "inactive"
            ? "This course is already inactive. You can reactivate it from the edit page."
            : "The course will be marked inactive so it is not used for new certificates. Existing records stay in place."
        }
        confirmLabel={deactivateTarget?.status === "inactive" ? "Close" : "Deactivate"}
        danger={deactivateTarget?.status !== "inactive"}
        onClose={() => setDeactivateId(null)}
        onConfirm={async () => {
          if (!deactivateTarget) return;
          if (deactivateTarget.status !== "inactive") {
            await updateCourse(deactivateTarget.id, { status: "inactive" });
          }
          setDeactivateId(null);
        }}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 text-ink">{value}</dd>
    </div>
  );
}

function courseIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("account")) return <Calculator className="h-4 w-4" />;
  if (n.includes("computer") || n.includes("web") || n.includes("it")) return <Code2 className="h-4 w-4" />;
  if (n.includes("english") || n.includes("language")) return <Languages className="h-4 w-4" />;
  if (n.includes("health")) return <HeartPulse className="h-4 w-4" />;
  if (n.includes("lab")) return <FlaskConical className="h-4 w-4" />;
  if (n.includes("office")) return <Briefcase className="h-4 w-4" />;
  return <BookOpen className="h-4 w-4" />;
}

function courseIconTone(name: string) {
  const n = name.toLowerCase();
  if (n.includes("account")) return "bg-violet-100 text-violet-700";
  if (n.includes("computer") || n.includes("web")) return "bg-sky-100 text-sky-700";
  if (n.includes("english") || n.includes("language")) return "bg-amber-100 text-amber-800";
  if (n.includes("health")) return "bg-rose-100 text-rose-700";
  if (n.includes("lab")) return "bg-emerald-100 text-emerald-700";
  if (n.includes("office")) return "bg-orange-100 text-orange-700";
  return "bg-indigo-100 text-indigo-700";
}

function Stat({
  icon,
  tint,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  tint: "purple" | "blue" | "green" | "orange";
  label: string;
  value: number;
  hint?: string;
}) {
  const tones = {
    purple: "bg-violet-50 text-violet-600",
    blue: "bg-sky-50 text-teal-dark",
    green: "bg-emerald-50 text-success",
    orange: "bg-orange-50 text-orange-600",
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
