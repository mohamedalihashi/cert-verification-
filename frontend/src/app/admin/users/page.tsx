"use client";

import { RoleGate } from "@/components/admin-shell";
import { ConfirmDialog, Modal } from "@/components/dialogs";
import { Button, EmptyState, Field, Input, Select, StatusBadge } from "@/components/ui";
import { useApp } from "@/lib/store";
import type { User, UserRole } from "@/lib/types";
import { cn, formatDate, initials } from "@/lib/utils";
import {
  Filter,
  KeyRound,
  Plus,
  RotateCcw,
  Search,
  Shield,
  UserCheck,
  UserCog,
  UserPlus,
  Users,
  UserX,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

export default function UsersPage() {
  return (
    <RoleGate allow="super_admin">
      <UsersInner />
    </RoleGate>
  );
}

function UsersInner() {
  const { db, currentUser, createUser, setUserStatus, resetUserPassword } = useApp();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [status, setStatus] = useState<"active" | "disabled" | "">("");
  const [applied, setApplied] = useState({
    query: "",
    role: "" as UserRole | "",
    status: "" as "active" | "disabled" | "",
  });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("staff");
  const [password, setPassword] = useState("");
  const [createError, setCreateError] = useState("");
  const [statusTarget, setStatusTarget] = useState<User | null>(null);
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetError, setResetError] = useState("");

  const now = new Date();
  const thisMonth = db.users.filter((u) => {
    const d = new Date(u.createdAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
  const superCount = db.users.filter((u) => u.role === "super_admin").length;
  const staffCount = db.users.filter((u) => u.role === "staff").length;
  const activeCount = db.users.filter((u) => u.status === "active").length;

  const filtered = useMemo(() => {
    const q = applied.query.trim().toLowerCase();
    return db.users.filter((u) => {
      if (applied.role && u.role !== applied.role) return false;
      if (applied.status && u.status !== applied.status) return false;
      if (!q) return true;
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });
  }, [applied, db.users]);

  const sorted = [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const pageCount = Math.max(1, Math.ceil(sorted.length / perPage));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * perPage;
  const rows = sorted.slice(start, start + perPage);

  function applyFilters(e?: React.FormEvent) {
    e?.preventDefault();
    setApplied({ query, role, status });
    setPage(1);
  }

  function reset() {
    setQuery("");
    setRole("");
    setStatus("");
    setApplied({ query: "", role: "", status: "" });
    setPage(1);
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    const err = await createUser({ name, email, role: newRole, password });
    if (err) {
      setCreateError(err);
      return;
    }
    setName("");
    setEmail("");
    setPassword("");
    setNewRole("staff");
    setCreateError("");
    setCreateOpen(false);
  }

  async function submitReset(e: React.FormEvent) {
    e.preventDefault();
    if (!resetTarget) return;
    const err = await resetUserPassword(resetTarget.id, newPassword);
    if (err) {
      setResetError(err);
      return;
    }
    setResetTarget(null);
    setNewPassword("");
    setResetError("");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-display text-3xl text-ink">
            <UserCog className="h-7 w-7 text-teal" />
            Users
          </h1>
          <p className="mt-1 text-sm text-muted">Create, disable, and reset administrator accounts.</p>
        </div>
        <Button size="lg" className="rounded-full px-6" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat icon={<Users className="h-5 w-5" />} tint="purple" label="Total Users" value={db.users.length} />
        <Stat icon={<Shield className="h-5 w-5" />} tint="blue" label="Super Admins" value={superCount} />
        <Stat icon={<UserCog className="h-5 w-5" />} tint="green" label="Staff" value={staffCount} />
        <Stat icon={<UserCheck className="h-5 w-5" />} tint="orange" label="Active" value={activeCount} />
        <Stat icon={<UserPlus className="h-5 w-5" />} tint="red" label="Added This Month" value={thisMonth} />
      </div>

      <form onSubmit={applyFilters} className="rounded-2xl border border-line bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1.5fr_0.8fr_0.8fr_auto]">
          <label className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="h-11 w-full rounded-xl border border-line bg-white pl-10 pr-3 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
            />
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole | "")}
            className="h-11 rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-teal"
          >
            <option value="">All roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="staff">Admin / Staff</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "active" | "disabled" | "")}
            className="h-11 rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-teal"
          >
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
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
        <EmptyState title="No users" description="Create an administrator account to get started." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead>
                <tr className="bg-[#f4f0ff] text-[11px] font-semibold uppercase tracking-wide text-[#6b5b95]">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u, i) => {
                  const self = currentUser?.id === u.id;
                  return (
                    <tr key={u.id} className="border-t border-line/80 hover:bg-[#faf8ff]">
                      <td className="px-4 py-3">
                        <div className="inline-flex items-center gap-3">
                          <span
                            className={cn(
                              "grid h-9 w-9 place-items-center rounded-full text-xs font-bold",
                              AVATAR_TONES[i % AVATAR_TONES.length],
                            )}
                          >
                            {initials(u.name)}
                          </span>
                          <span className="font-medium text-ink">
                            {u.name}
                            {self && <span className="ml-2 text-xs font-normal text-muted">(you)</span>}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">{u.email}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={u.role} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <span className={cn("h-2 w-2 rounded-full", u.status === "active" ? "bg-success" : "bg-danger")} />
                          {u.status === "active" ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            className="rounded-lg p-2 text-teal hover:bg-sky-50"
                            onClick={() => {
                              setResetTarget(u);
                              setNewPassword("");
                              setResetError("");
                            }}
                            aria-label="Reset password"
                          >
                            <KeyRound className="h-4 w-4" />
                          </button>
                          {!self &&
                            (u.status === "active" ? (
                              <button
                                type="button"
                                className="rounded-lg p-2 text-danger hover:bg-red-50"
                                onClick={() => setStatusTarget(u)}
                                aria-label="Disable user"
                              >
                                <UserX className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="rounded-lg p-2 text-success hover:bg-emerald-50"
                                onClick={() => void setUserStatus(u.id, "active")}
                                aria-label="Enable user"
                              >
                                <UserCheck className="h-4 w-4" />
                              </button>
                            ))}
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
              {sorted.length} users.
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

      <Modal open={createOpen} title="Add User" onClose={() => setCreateOpen(false)}>
        <form onSubmit={submitCreate} className="space-y-4">
          <Field label="Full name">
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="Role">
            <Select value={newRole} onChange={(e) => setNewRole(e.target.value as UserRole)}>
              <option value="staff">Admin / Staff</option>
              <option value="super_admin">Super Admin</option>
            </Select>
          </Field>
          <Field label="Password">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </Field>
          {createError && <p className="text-sm text-danger">{createError}</p>}
          <Button type="submit" className="w-full">
            Create administrator
          </Button>
        </form>
      </Modal>

      <Modal
        open={Boolean(resetTarget)}
        title={`Reset password${resetTarget ? ` — ${resetTarget.name}` : ""}`}
        onClose={() => setResetTarget(null)}
      >
        <form onSubmit={submitReset} className="space-y-4">
          <Field label="New password">
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </Field>
          {resetError && <p className="text-sm text-danger">{resetError}</p>}
          <Button type="submit" className="w-full">
            Update password
          </Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(statusTarget)}
        title="Disable administrator?"
        description={`${statusTarget?.name ?? "This user"} will no longer be able to sign in. You can enable the account again later.`}
        confirmLabel="Disable"
        danger
        onClose={() => setStatusTarget(null)}
        onConfirm={async () => {
          if (!statusTarget) return;
          await setUserStatus(statusTarget.id, "disabled");
          setStatusTarget(null);
        }}
      />
    </div>
  );
}

const AVATAR_TONES = [
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-700",
];

function Stat({
  icon,
  tint,
  label,
  value,
}: {
  icon: ReactNode;
  tint: "purple" | "blue" | "green" | "orange" | "red";
  label: string;
  value: number;
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
    </div>
  );
}
