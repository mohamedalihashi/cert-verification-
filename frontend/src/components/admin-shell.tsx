"use client";

import { BrandMark } from "@/components/brand";
import { ACADEMY_NAME } from "@/lib/brand";
import { useApp } from "@/lib/store";
import { cn, formatRelative, initials } from "@/lib/utils";
import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  CircleUser,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  Settings,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/certificates", label: "Certificates", icon: Award },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/users", label: "Users", icon: Users, superOnly: true },
  { href: "/admin/logs", label: "Activity Logs", icon: ScrollText, superOnly: true },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/profile", label: "Profile", icon: CircleUser },
  { href: "/admin/settings", label: "Settings", icon: Settings, superOnly: true },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const { hydrated, currentUser, logout, db, isSuperAdmin } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const notesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!currentUser) router.replace("/login");
  }, [hydrated, currentUser, router]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!notesRef.current?.contains(e.target as Node)) setNotesOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const recentLogs = useMemo(
    () => [...db.logs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8),
    [db.logs],
  );
  const noteCount = recentLogs.filter(
    (l) => Date.now() - new Date(l.createdAt).getTime() < 24 * 60 * 60 * 1000,
  ).length;

  if (!hydrated || !currentUser) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f4f7fb] text-muted">
        Loading registry…
      </div>
    );
  }

  const items = NAV.filter((i) => !i.superOnly || isSuperAdmin);
  const roleLabel = currentUser.role === "super_admin" ? "Super Admin" : "Admin / Staff";

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[240px] flex-col bg-ink text-cream transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full",
          sidebarHidden ? "lg:-translate-x-full" : "lg:translate-x-0",
        )}
      >
        <div className="flex items-start justify-between gap-2 px-4 py-5">
          <Link href="/admin" className="min-w-0" onClick={() => setOpen(false)}>
            <BrandMark sidebar light />
          </Link>
          <button type="button" className="mt-1 lg:hidden" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {items.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                  active
                    ? "bg-gradient-to-r from-[#0099e5] to-[#7c5cfc] text-white shadow-sm"
                    : "text-cream/75 hover:bg-white/10 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 pb-2">
          <DiplomaMark />
        </div>
        <div className="border-t border-white/10 p-4">
          <Link
            href="/admin/profile"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl p-2",
              pathname.startsWith("/admin/profile") ? "bg-white/10" : "hover:bg-white/5",
            )}
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-teal text-sm font-bold text-white">
              {initials(currentUser.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{currentUser.name}</p>
              <p className="text-xs text-cream/60">View profile</p>
            </div>
          </Link>
        </div>
      </aside>

      {open && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-ink/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        />
      )}

      <div
        className={cn(
          "flex min-h-screen flex-col transition-[padding] duration-300",
          sidebarHidden ? "lg:pl-0" : "lg:pl-[240px]",
        )}
      >
        <header className="sticky top-0 z-20 border-b border-line bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" className="lg:hidden" onClick={() => setOpen(true)}>
                <Menu className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="hidden rounded-lg p-2 text-muted hover:bg-cream hover:text-ink lg:inline-flex"
                onClick={() => setSidebarHidden((hidden) => !hidden)}
                aria-label={sidebarHidden ? "Show sidebar" : "Hide sidebar"}
                title={sidebarHidden ? "Show sidebar" : "Hide sidebar"}
              >
                {sidebarHidden ? (
                  <PanelLeftOpen className="h-5 w-5" />
                ) : (
                  <PanelLeftClose className="h-5 w-5" />
                )}
              </button>
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-teal-dark">
                  Welcome back, {currentUser.name.split(" ")[0]} 👋
                </p>
                <p className="text-xs text-muted">{roleLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:bg-cream"
              >
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">Public site</span>
              </Link>
              <div className="relative" ref={notesRef}>
                <button
                  type="button"
                  onClick={() => setNotesOpen((v) => !v)}
                  className="relative rounded-lg p-2 text-muted hover:bg-cream"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {noteCount > 0 && (
                    <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                      {noteCount > 9 ? "9+" : noteCount}
                    </span>
                  )}
                </button>
                {notesOpen && (
                  <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-2xl border border-line bg-white shadow-lg">
                    <p className="border-b border-line px-4 py-3 text-sm font-semibold">Recent activity</p>
                    <ul className="max-h-80 overflow-y-auto">
                      {recentLogs.length === 0 ? (
                        <li className="px-4 py-6 text-sm text-muted">No recent activity.</li>
                      ) : (
                        recentLogs.map((log) => (
                          <li key={log.id} className="border-b border-line/70 px-4 py-3 last:border-0">
                            <p className="text-sm text-ink">{log.action}</p>
                            <p className="mt-0.5 text-xs text-muted">
                              {log.userName} · {formatRelative(log.createdAt)}
                            </p>
                          </li>
                        ))
                      )}
                    </ul>
                    {isSuperAdmin && (
                      <Link
                        href="/admin/logs"
                        onClick={() => setNotesOpen(false)}
                        className="block px-4 py-3 text-center text-sm font-medium text-teal"
                      >
                        View all logs
                      </Link>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  router.replace("/login");
                }}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink hover:bg-cream"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[88rem] flex-1 px-4 py-4 sm:px-5">{children}</main>
        <footer className="mt-auto border-t border-line bg-white px-4 py-4 sm:px-6">
          <div className="mx-auto flex max-w-[88rem] flex-col gap-2 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>
              © <span suppressHydrationWarning>{new Date().getFullYear()}</span> {ACADEMY_NAME}{" "}
              Certificate Registry System. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <span>Version 1.0.0</span>
              <span className="rounded-full bg-teal/10 px-2 py-0.5 font-semibold text-teal-dark">
                {roleLabel}
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export function RoleGate({
  children,
  allow,
}: {
  children: ReactNode;
  allow: "super_admin" | "any";
}) {
  const { hydrated, currentUser, isSuperAdmin } = useApp();
  if (!hydrated) return null;
  if (!currentUser) return null;
  if (allow === "super_admin" && !isSuperAdmin) {
    return (
      <div className="rounded-2xl border border-line bg-paper p-10 text-center">
        <h1 className="font-display text-2xl">Access denied</h1>
        <p className="mt-2 text-sm text-muted">
          This page is available to Super Administrators only.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}

function DiplomaMark() {
  return (
    <div className="flex justify-center py-2" aria-hidden>
      <svg width="88" height="56" viewBox="0 0 88 56" fill="none">
        <ellipse cx="18" cy="40" rx="10" ry="6" fill="#f9a8d4" opacity="0.7" />
        <ellipse cx="72" cy="14" rx="8" ry="5" fill="#fcd34d" opacity="0.8" />
        <rect x="22" y="14" width="44" height="26" rx="3" fill="#e2e8f0" />
        <rect x="26" y="18" width="36" height="18" rx="2" fill="#f8fafc" />
        <path d="M40 28c0-4 4-4 4 0v10l-2-1.5-2 1.5V28Z" fill="#fb7185" />
        <circle cx="44" cy="28" r="4" fill="#fbbf24" />
        <path d="M16 8l2 4 4 .4-3 2.8.9 4-3.9-2.2-3.9 2.2.9-4-3-2.8 4-.4Z" fill="#fbbf24" />
        <path d="M70 36l1.4 2.8 3.1.3-2.3 2.1.7 3-2.9-1.6-2.9 1.6.7-3-2.3-2.1 3.1-.3Z" fill="#fbbf24" />
      </svg>
    </div>
  );
}
