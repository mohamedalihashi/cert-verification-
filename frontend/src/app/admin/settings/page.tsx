"use client";

import { RoleGate } from "@/components/admin-shell";
import { Button, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { useApp } from "@/lib/store";
import { useState } from "react";

export default function SettingsPage() {
  return (
    <RoleGate allow="super_admin">
      <SettingsInner />
    </RoleGate>
  );
}

function SettingsInner() {
  const { db, updateSettings } = useApp();
  const [form, setForm] = useState(db.settings);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await updateSettings({
      ...form,
      maxCertFileMb: Number(form.maxCertFileMb),
      maxPhotoMb: Number(form.maxPhotoMb),
    });
  }

  return (
    <div>
      <PageHeader title="Settings" description="School identity and verification URL used on QR codes." />
      <form onSubmit={submit} className="max-w-2xl space-y-4 rounded-2xl border border-line bg-paper p-6">
        <Field label="School name">
          <Input value={form.schoolName} onChange={(e) => setForm({ ...form, schoolName: e.target.value })} />
        </Field>
        <Field label="Short name">
          <Input value={form.schoolShortName} onChange={(e) => setForm({ ...form, schoolShortName: e.target.value })} />
        </Field>
        <Field label="Tagline">
          <Input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
        </Field>
        <Field label="Address">
          <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
        </div>
        <Field label="Website">
          <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
        </Field>
        <Field
          label="Public base URL"
          hint="Leave blank to use this site's current origin for QR codes and verification links."
        >
          <Input
            value={form.publicBaseUrl}
            onChange={(e) => setForm({ ...form, publicBaseUrl: e.target.value })}
            placeholder="https://school.com"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Max student photo (MB)">
            <Input
              type="number"
              value={form.maxPhotoMb}
              onChange={(e) => setForm({ ...form, maxPhotoMb: Number(e.target.value) })}
            />
          </Field>
        </div>
        <Button type="submit">Save settings</Button>
      </form>
    </div>
  );
}
