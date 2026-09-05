"use client";

import { Button } from "@/components/ui";
import { useApp } from "@/lib/store";
import { formatDate, initials } from "@/lib/utils";
import {
  BadgeCheck,
  CalendarDays,
  Crown,
  Eye,
  EyeOff,
  Info,
  Lock,
  Mail,
  Pencil,
  Save,
  Shield,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function ProfilePage() {
  const { currentUser, updateProfile, changePassword } = useApp();
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(currentUser?.name ?? "");
  const [email, setEmail] = useState(currentUser?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    setName(currentUser.name);
    setEmail(currentUser.email);
  }, [currentUser?.id, currentUser?.name, currentUser?.email]);

  if (!currentUser) return null;

  const roleLabel = currentUser.role === "super_admin" ? "Super Admin" : "Admin / Staff";
  const joined = formatDate(currentUser.createdAt);
  const dirty = name !== currentUser.name || email !== currentUser.email;

  function cancelProfile() {
    setName(currentUser.name);
    setEmail(currentUser.email);
    setProfileError("");
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    const nextName = name.trim();
    const nextEmail = email.trim();
    if (!nextName) {
      setProfileError("Enter your full name.");
      return;
    }
    if (!nextEmail) {
      setProfileError("Enter your email address.");
      return;
    }
    setProfileError("");
    setSavingProfile(true);
    try {
      const err = await updateProfile({ name: nextName, email: nextEmail });
      if (err) setProfileError(err);
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    if (!currentPassword) {
      setPasswordError("Enter your current password.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Use at least 8 characters with a mix of letters, numbers & symbols.");
      return;
    }
    if (newPassword !== confirm) {
      setPasswordError("New passwords do not match.");
      return;
    }
    setSavingPassword(true);
    try {
      const err = await changePassword(currentPassword, newPassword);
      if (err) {
        setPasswordError(err);
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-line bg-white shadow-sm">
        <div className="relative bg-gradient-to-r from-[#dbeafe] via-[#ede9fe] to-[#f3e8ff] px-6 pb-6 pt-8 sm:px-8">
          <BannerArt />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-end gap-4">
              <div className="relative">
                <span className="grid h-24 w-24 place-items-center rounded-full bg-[#7c5cfc] text-3xl font-bold text-white shadow-lg ring-4 ring-white">
                  {initials(currentUser.name)}
                </span>
                <button
                  type="button"
                  onClick={() => nameRef.current?.focus()}
                  className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border border-line bg-white text-teal shadow-sm"
                  aria-label="Edit profile"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="pb-1">
                <p className="flex items-center gap-2 font-display text-2xl text-ink">
                  {currentUser.name}
                  <BadgeCheck className="h-5 w-5 text-teal" />
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm text-muted">
                  <Mail className="h-4 w-4" />
                  {currentUser.email}
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm text-muted">
                  <CalendarDays className="h-4 w-4" />
                  Member since {joined}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pb-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-800">
                {currentUser.role === "super_admin" ? <Crown className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
                {roleLabel}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-800">
                <span className="h-2 w-2 rounded-full bg-success" />
                {currentUser.status === "active" ? "Active" : "Disabled"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <form noValidate onSubmit={saveProfile} className="space-y-4 rounded-3xl border border-line bg-white p-6 shadow-sm">
          <div>
            <h2 className="flex items-center gap-2 font-display text-xl text-ink">
              <UserRound className="h-5 w-5 text-teal" />
              Profile Details
            </h2>
            <p className="mt-1 text-sm text-muted">Update your account information and profile details.</p>
          </div>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-ink">Full name</span>
            <span className="relative block">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                ref={nameRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11 w-full rounded-xl border border-line bg-white pl-10 pr-3 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
              />
            </span>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-ink">Email</span>
            <span className="relative block">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 w-full rounded-xl border border-line bg-white pl-10 pr-3 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
              />
            </span>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-ink">Role</span>
            <span className="relative block">
              <Shield className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={roleLabel}
                disabled
                className="h-11 w-full rounded-xl border border-line bg-[#f8f7ff] pl-10 pr-3 text-sm text-ink"
              />
            </span>
          </label>
          <div className="flex gap-2 rounded-2xl bg-[#f4f0ff] px-3 py-3 text-sm text-[#5b4b8a]">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            Member since {joined}. Role can only be changed by a Super Admin.
          </div>
          {profileError && <p className="text-sm text-danger">{profileError}</p>}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={savingProfile}>
              <Save className="h-4 w-4" />
              {savingProfile ? "Saving…" : "Save Profile"}
            </Button>
            <Button type="button" variant="secondary" onClick={cancelProfile} disabled={!dirty}>
              Cancel
            </Button>
          </div>
        </form>

        <form noValidate onSubmit={savePassword} className="space-y-4 rounded-3xl border border-line bg-white p-6 shadow-sm">
          <div>
            <h2 className="flex items-center gap-2 font-display text-xl text-ink">
              <Lock className="h-5 w-5 text-[#7c5cfc]" />
              Change Password
            </h2>
            <p className="mt-1 text-sm text-muted">Ensure your account is using a long, random password.</p>
          </div>
          <PasswordField
            label="Current password"
            placeholder="Enter current password"
            value={currentPassword}
            onChange={setCurrentPassword}
            visible={showCurrent}
            onToggle={() => setShowCurrent((v) => !v)}
          />
          <PasswordField
            label="New password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={setNewPassword}
            visible={showNew}
            onToggle={() => setShowNew((v) => !v)}
          />
          <PasswordField
            label="Confirm new password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={setConfirm}
            visible={showConfirm}
            onToggle={() => setShowConfirm((v) => !v)}
          />
          <div className="flex gap-2 rounded-2xl bg-[#f4f0ff] px-3 py-3 text-sm text-[#5b4b8a]">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            Use at least 8 characters with a mix of letters, numbers & symbols.
          </div>
          {passwordError && <p className="text-sm text-danger">{passwordError}</p>}
          <Button type="submit" className="bg-[#7c5cfc] hover:bg-[#6b4ee8]" disabled={savingPassword}>
            <Lock className="h-4 w-4" />
            {savingPassword ? "Updating…" : "Update Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function PasswordField({
  label,
  placeholder,
  value,
  onChange,
  visible,
  onToggle,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-ink">{label}</span>
      <span className="relative block">
        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="current-password"
          className="h-11 w-full rounded-xl border border-line bg-white py-2 pl-10 pr-10 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
    </label>
  );
}

function BannerArt() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -right-6 top-2 hidden h-28 w-28 rounded-full bg-white/50 sm:block" />
      <div className="absolute right-28 top-6 hidden h-16 w-16 rounded-full bg-[#c4b5fd]/50 lg:block" />
      <Lock className="absolute right-8 top-8 hidden h-8 w-8 text-[#7c5cfc]/40 lg:block" />
      <UserRound className="absolute right-36 top-10 hidden h-10 w-10 text-teal/30 lg:block" />
    </div>
  );
}
