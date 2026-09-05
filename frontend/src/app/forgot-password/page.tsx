"use client";

import { BrandMark } from "@/components/brand";
import { Button, Field, Input } from "@/components/ui";
import { api } from "@/lib/api";
import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send verification code.");
    }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    try {
      await api("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, otp, password }),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password.");
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-cream px-4">
      <div className="w-full max-w-md rounded-3xl border border-line bg-paper p-8">
        <BrandMark compact />
        <h1 className="mt-6 font-display text-3xl">Forgot password</h1>
        {done ? (
          <p className="mt-4 text-sm text-muted">
            Password updated. You can now <Link href="/login" className="text-teal underline">sign in</Link>.
          </p>
        ) : sent ? (
          <form onSubmit={resetPassword} className="mt-6 space-y-4">
            <p className="text-sm text-muted">Enter the six-digit code sent to {email}. It expires in 10 minutes.</p>
            <Field label="Verification code">
              <Input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} required />
            </Field>
            <Field label="New password">
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </Field>
            <Field label="Confirm password">
              <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </Field>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" className="w-full">Reset password</Button>
          </form>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            <Button type="submit" className="w-full">
              Send verification code
            </Button>
            {error && <p className="text-sm text-danger">{error}</p>}
          </form>
        )}
        <p className="mt-6 text-sm">
          <Link href="/login" className="text-teal hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
