"use client";

import { Button, StatusBadge } from "@/components/ui";
import { useApp } from "@/lib/store";
import { cn, formatDate, formatRelative, percentChange } from "@/lib/utils";
import {
  Award,
  BookOpen,
  CalendarDays,
  FileBarChart,
  FileCheck2,
  FileX2,
  GraduationCap,
  LayoutGrid,
  MoreVertical,
  Plus,
  Search,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function DashboardPage() {
  const { db, studentById, courseById, isSuperAdmin } = useApp();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [range, setRange] = useState("6");
  const [menuId, setMenuId] = useState<string | null>(null);

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const lastMonthDate = new Date(thisYear, thisMonth - 1, 1);
  const prevYear = thisYear - 1;

  const inMonth = (iso: string, year: number, month: number) => {
    const d = new Date(iso);
    return d.getFullYear() === year && d.getMonth() === month;
  };
  const inYear = (iso: string, year: number) => new Date(iso).getFullYear() === year;

  const studentsThisMonth = db.students.filter((s) => inMonth(s.createdAt, thisYear, thisMonth)).length;
  const studentsLastMonth = db.students.filter((s) =>
    inMonth(s.createdAt, lastMonthDate.getFullYear(), lastMonthDate.getMonth()),
  ).length;
  const certsThisMonth = db.certificates.filter((c) => inMonth(c.createdAt, thisYear, thisMonth)).length;
  const certsLastMonth = db.certificates.filter((c) =>
    inMonth(c.createdAt, lastMonthDate.getFullYear(), lastMonthDate.getMonth()),
  ).length;
  const issuedThisMonth = db.certificates.filter((c) => inMonth(c.issueDate, thisYear, thisMonth)).length;
  const issuedLastMonth = db.certificates.filter((c) =>
    inMonth(c.issueDate, lastMonthDate.getFullYear(), lastMonthDate.getMonth()),
  ).length;
  const issuedThisYear = db.certificates.filter((c) => inYear(c.issueDate, thisYear)).length;
  const issuedLastYear = db.certificates.filter((c) => inYear(c.issueDate, prevYear)).length;
  const valid = db.certificates.filter((c) => c.status === "valid").length;
  const revoked = db.certificates.filter((c) => c.status === "revoked").length;
  const otherStatus = db.certificates.filter((c) => c.status !== "valid" && c.status !== "revoked").length;
  const activeCourses = db.courses.filter((c) => c.status === "active").length;
  const coursesThisMonth = db.courses.filter((c) => inMonth(c.createdAt, thisYear, thisMonth)).length;
  const coursesLastMonth = db.courses.filter((c) =>
    inMonth(c.createdAt, lastMonthDate.getFullYear(), lastMonthDate.getMonth()),
  ).length;
  const totalCerts = db.certificates.length || 1;

  const monthCount = Number(range);
  const series = useMemo(() => {
    const points = [];
    for (let i = monthCount - 1; i >= 0; i -= 1) {
      const d = new Date(thisYear, thisMonth - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const issued = db.certificates.filter((c) => inMonth(c.issueDate, y, m)).length;
      const validN = db.certificates.filter((c) => inMonth(c.issueDate, y, m) && c.status === "valid").length;
      const revokedN = db.certificates.filter((c) => inMonth(c.issueDate, y, m) && c.status === "revoked").length;
      points.push({ label: MONTHS[m], issued, valid: validN, revoked: revokedN });
    }
    return points;
  }, [db.certificates, monthCount, thisMonth, thisYear]);

  const recent = [...db.certificates]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const topCourses = [...db.courses]
    .map((course) => ({
      ...course,
      count: db.certificates.filter((c) => c.courseId === course.id).length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const topMax = Math.max(1, ...topCourses.map((c) => c.count));

  const activity = [...db.logs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);

  const hits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [] as { href: string; title: string; meta: string }[];
    const students = db.students
      .filter((s) => s.fullName.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q))
      .slice(0, 4)
      .map((s) => ({ href: `/admin/students/${s.id}`, title: s.fullName, meta: s.studentId }));
    const certs = db.certificates
      .filter((c) => {
        const student = studentById(c.studentId);
        return (
          c.certificateNumber.toLowerCase().includes(q) ||
          (student?.fullName.toLowerCase().includes(q) ?? false)
        );
      })
      .slice(0, 4)
      .map((c) => ({
        href: `/admin/certificates/${c.id}`,
        title: c.certificateNumber,
        meta: studentById(c.studentId)?.fullName ?? "Certificate",
      }));
    const courses = db.courses
      .filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
      .slice(0, 3)
      .map((c) => ({ href: `/admin/courses/${c.id}/edit`, title: c.name, meta: c.code }));
    return [...certs, ...students, ...courses].slice(0, 8);
  }, [query, db.students, db.certificates, db.courses, studentById]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    if (hits[0]) router.push(hits[0].href);
    else router.push(`/admin/certificates?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">Certificate registry overview.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <form onSubmit={submitSearch} className="relative min-w-0 flex-1 sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search students, certificates, courses..."
              className="h-11 w-full rounded-full border border-line bg-white pl-10 pr-4 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
            />
            {hits.length > 0 && (
              <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-2xl border border-line bg-white shadow-lg">
                {hits.map((hit) => (
                  <li key={hit.href}>
                    <Link
                      href={hit.href}
                      className="block px-4 py-2.5 hover:bg-cream"
                      onClick={() => setQuery("")}
                    >
                      <p className="text-sm font-medium text-ink">{hit.title}</p>
                      <p className="text-xs text-muted">{hit.meta}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </form>
          <Link href="/admin/students/new">
            <Button size="sm" className="rounded-full">
              <Plus className="h-4 w-4" />
              Add Student
            </Button>
          </Link>
          <Link href="/admin/certificates/new">
            <Button size="sm" variant="gold" className="rounded-full">
              <Plus className="h-4 w-4" />
              Add Certificate
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total Students"
          value={db.students.length}
          hint={`${signed(percentChange(studentsThisMonth, studentsLastMonth))} from last month`}
          up={studentsThisMonth >= studentsLastMonth}
          icon={<GraduationCap className="h-5 w-5" />}
          tint="blue"
        />
        <StatCard
          label="Total Certificates"
          value={db.certificates.length}
          hint={`${signed(percentChange(certsThisMonth, certsLastMonth))} from last month`}
          up={certsThisMonth >= certsLastMonth}
          icon={<Award className="h-5 w-5" />}
          tint="green"
        />
        <StatCard
          label="Issued This Month"
          value={issuedThisMonth}
          hint={`${signed(percentChange(issuedThisMonth, issuedLastMonth))} from last month`}
          up={issuedThisMonth >= issuedLastMonth}
          icon={<FileCheck2 className="h-5 w-5" />}
          tint="purple"
        />
        <StatCard
          label="Issued This Year"
          value={issuedThisYear}
          hint={`${signed(percentChange(issuedThisYear, issuedLastYear))} from last year`}
          up={issuedThisYear >= issuedLastYear}
          icon={<CalendarDays className="h-5 w-5" />}
          tint="orange"
        />
        <StatCard
          label="Valid Certificates"
          value={valid}
          hint={`${Math.round((valid / totalCerts) * 100)}% of total certificates`}
          up
          icon={<ShieldCheck className="h-5 w-5" />}
          tint="green"
        />
        <StatCard
          label="Revoked Certificates"
          value={revoked}
          hint={`${Math.round((revoked / totalCerts) * 100)}% of total certificates`}
          up={false}
          icon={<FileX2 className="h-5 w-5" />}
          tint="red"
        />
        <StatCard
          label="Total Courses"
          value={db.courses.length}
          hint={`${signed(percentChange(coursesThisMonth, coursesLastMonth))} from last month`}
          up={coursesThisMonth >= coursesLastMonth}
          icon={<BookOpen className="h-5 w-5" />}
          tint="blue"
        />
        <StatCard
          label="Active Courses"
          value={activeCourses}
          hint={`${db.courses.length ? Math.round((activeCourses / db.courses.length) * 100) : 0}% of total courses`}
          up
          icon={<LayoutGrid className="h-5 w-5" />}
          tint="purple"
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.4fr_0.9fr_0.85fr]">
        <section className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-display text-lg">Certificates Overview</h2>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="h-9 rounded-lg border border-line bg-white px-2 text-sm"
            >
              <option value="6">Last 6 Months</option>
              <option value="12">Last 12 Months</option>
            </select>
          </div>
          <LineChart data={series} />
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
            <LegendDot color="#0099e5" label="Issued" />
            <LegendDot color="#00965e" label="Valid" />
            <LegendDot color="#dc2626" label="Revoked" />
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <h2 className="font-display text-lg">Certificates by Status</h2>
          <DonutChart valid={valid} revoked={revoked} other={otherStatus} />
        </section>

        <section className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <h2 className="font-display text-lg">Quick Actions</h2>
          <div className="mt-4 space-y-3">
            <QuickAction href="/admin/students/new" icon={<UserPlus className="h-5 w-5" />} tint="blue" label="Add New Student" />
            <QuickAction href="/admin/certificates/new" icon={<Award className="h-5 w-5" />} tint="green" label="Add New Certificate" />
            <QuickAction href="/admin/courses" icon={<BookOpen className="h-5 w-5" />} tint="purple" label="Manage Courses" />
            <QuickAction href="/admin/reports" icon={<FileBarChart className="h-5 w-5" />} tint="orange" label="Generate Report" />
          </div>
        </section>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.35fr_0.85fr_0.9fr]">
        <section className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg">Recent Certificates</h2>
            <Link href="/admin/certificates" className="text-sm font-medium text-teal">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-muted">
                  <th className="pb-3 font-semibold">Certificate ID</th>
                  <th className="pb-3 font-semibold">Student</th>
                  <th className="pb-3 font-semibold">Course</th>
                  <th className="pb-3 font-semibold">Issue Date</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {recent.map((c) => {
                  const student = studentById(c.studentId);
                  const course = courseById(c.courseId);
                  return (
                    <tr key={c.id} className="border-t border-line/80">
                      <td className="py-3">
                        <Link href={`/admin/certificates/${c.id}`} className="font-mono text-teal hover:underline">
                          {c.certificateNumber}
                        </Link>
                      </td>
                      <td className="py-3">{student?.fullName ?? "—"}</td>
                      <td className="py-3">{course?.name ?? "—"}</td>
                      <td className="py-3 whitespace-nowrap">{formatDate(c.issueDate)}</td>
                      <td className="py-3">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="relative py-3 text-right">
                        <button
                          type="button"
                          className="rounded-lg p-1 text-muted hover:bg-cream"
                          onClick={() => setMenuId(menuId === c.id ? null : c.id)}
                          aria-label="Certificate actions"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {menuId === c.id && (
                          <div className="absolute right-0 z-10 mt-1 w-36 overflow-hidden rounded-xl border border-line bg-white text-left shadow-lg">
                            <Link href={`/admin/certificates/${c.id}`} className="block px-3 py-2 text-sm hover:bg-cream">
                              View
                            </Link>
                            <Link href={`/admin/certificates/${c.id}/edit`} className="block px-3 py-2 text-sm hover:bg-cream">
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
        </section>

        <section className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg">Top Courses</h2>
            <Link href="/admin/courses" className="text-sm font-medium text-teal">
              View all
            </Link>
          </div>
          <ul className="space-y-4">
            {topCourses.map((course) => (
              <li key={course.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{course.name}</span>
                  <span className="text-muted">{course.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-cream">
                  <div
                    className="h-full rounded-full bg-teal"
                    style={{ width: `${Math.max(8, (course.count / topMax) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg">Recent Activity</h2>
            {isSuperAdmin ? (
              <Link href="/admin/logs" className="text-sm font-medium text-teal">
                View all
              </Link>
            ) : null}
          </div>
          <ol className="space-y-4">
            {activity.length === 0 ? (
              <li className="text-sm text-muted">No activity recorded yet.</li>
            ) : (
              activity.map((log) => (
                <li key={log.id} className="flex gap-3">
                  <span className={cn("mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full", activityTint(log.action))}>
                    {activityIcon(log.recordType)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{log.action}</p>
                    <p className="text-xs text-muted">
                      {log.userName} · {formatRelative(log.createdAt)}
                    </p>
                  </div>
                </li>
              ))
            )}
          </ol>
        </section>
      </div>
    </div>
  );
}

function signed(n: number) {
  if (n > 0) return `↑ ${n}%`;
  if (n < 0) return `↓ ${Math.abs(n)}%`;
  return "No change";
}

function StatCard({
  label,
  value,
  hint,
  up,
  icon,
  tint,
}: {
  label: string;
  value: number;
  hint: string;
  up: boolean;
  icon: ReactNode;
  tint: "blue" | "green" | "purple" | "orange" | "red";
}) {
  const tones = {
    blue: "bg-sky-50 text-teal-dark",
    green: "bg-emerald-50 text-success",
    purple: "bg-violet-50 text-violet-600",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-danger",
  };
  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-muted">{label}</p>
        <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", tones[tint])}>{icon}</span>
      </div>
      <p className="mt-2 font-display text-2xl text-ink">{value}</p>
      <p className={cn("mt-1 text-xs", up ? "text-success" : "text-danger")}>{hint}</p>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  tint,
  label,
}: {
  href: string;
  icon: ReactNode;
  tint: "blue" | "green" | "purple" | "orange";
  label: string;
}) {
  const tones = {
    blue: "bg-sky-50 text-teal-dark",
    green: "bg-emerald-50 text-success",
    purple: "bg-violet-50 text-violet-600",
    orange: "bg-orange-50 text-orange-600",
  };
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-line px-3 py-3 hover:bg-cream"
    >
      <span className={cn("grid h-10 w-10 place-items-center rounded-xl", tones[tint])}>{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function LineChart({
  data,
}: {
  data: { label: string; issued: number; valid: number; revoked: number }[];
}) {
  const w = 560;
  const h = 200;
  const pad = { l: 28, r: 8, t: 12, b: 28 };
  const max = Math.max(1, ...data.flatMap((d) => [d.issued, d.valid, d.revoked]));
  const x = (i: number) => pad.l + (i * (w - pad.l - pad.r)) / Math.max(1, data.length - 1);
  const y = (v: number) => pad.t + (1 - v / max) * (h - pad.t - pad.b);
  const path = (key: "issued" | "valid" | "revoked") =>
    data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d[key])}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-44 w-full">
      {[0, 0.5, 1].map((t) => (
        <line
          key={t}
          x1={pad.l}
          x2={w - pad.r}
          y1={y(max * t)}
          y2={y(max * t)}
          stroke="#e6eef4"
        />
      ))}
      <path d={path("issued")} fill="none" stroke="#0099e5" strokeWidth="2.5" />
      <path d={path("valid")} fill="none" stroke="#00965e" strokeWidth="2.5" />
      <path d={path("revoked")} fill="none" stroke="#dc2626" strokeWidth="2.5" />
      {data.map((d, i) => (
        <text key={d.label} x={x(i)} y={h - 6} textAnchor="middle" fontSize="11" fill="#5a6b75">
          {d.label}
        </text>
      ))}
    </svg>
  );
}

function DonutChart({ valid, revoked, other }: { valid: number; revoked: number; other: number }) {
  const total = valid + revoked + other;
  const slices = [
    { label: `Valid (${valid})`, value: valid, color: "#00965e" },
    { label: `Other (${other})`, value: other, color: "#0099e5" },
    { label: `Revoked (${revoked})`, value: revoked, color: "#dc2626" },
  ].filter((s) => s.value > 0 || total === 0);
  const r = 54;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const safeTotal = total || 1;

  return (
    <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
      <svg viewBox="0 0 140 140" className="h-32 w-32 shrink-0">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#eef4f8" strokeWidth="16" />
        {total === 0 ? null : (
          slices.map((s) => {
            const len = (s.value / safeTotal) * c;
            const circle = (
              <circle
                key={s.label}
                cx="70"
                cy="70"
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth="16"
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                transform="rotate(-90 70 70)"
              />
            );
            offset += len;
            return circle;
          })
        )}
        <text x="70" y="66" textAnchor="middle" fontSize="18" fontWeight="700" fill="#0b1f2c">
          {total}
        </text>
        <text x="70" y="84" textAnchor="middle" fontSize="10" fill="#5a6b75">
          Total
        </text>
      </svg>
      <ul className="space-y-2 text-sm">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            <span>
              {s.label}
              {total ? ` · ${Math.round((s.value / safeTotal) * 100)}%` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function activityTint(action: string) {
  const a = action.toLowerCase();
  if (a.includes("revoke")) return "bg-red-50 text-danger";
  if (a.includes("certificate")) return "bg-emerald-50 text-success";
  if (a.includes("student")) return "bg-sky-50 text-teal-dark";
  if (a.includes("course")) return "bg-violet-50 text-violet-600";
  return "bg-orange-50 text-orange-600";
}

function activityIcon(recordType: string) {
  if (recordType === "student") return <GraduationCap className="h-4 w-4" />;
  if (recordType === "course") return <BookOpen className="h-4 w-4" />;
  if (recordType === "certificate") return <Award className="h-4 w-4" />;
  return <FileCheck2 className="h-4 w-4" />;
}
