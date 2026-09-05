"use client";

import { PhotoUpload } from "@/components/photo-upload";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { useApp } from "@/lib/store";
import type { Certificate, CertificateStatus, Gender, GradeEntry } from "@/lib/types";
import {
  makePortrait,
  nextStudentId,
  uid,
} from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

export function CertificateForm({ certificate }: { certificate?: Certificate }) {
  const {
    db,
    createStudent,
    createCertificate,
    updateCertificate,
    studentById,
  } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const presetStudent = params.get("studentId") ?? certificate?.studentId ?? "";

  const [mode, setMode] = useState<"existing" | "new">(presetStudent ? "existing" : "existing");
  const [studentQuery, setStudentQuery] = useState("");
  const [studentId, setStudentId] = useState(presetStudent);
  const [newStudent, setNewStudent] = useState({
    studentId: nextStudentId(db.students.map((s) => s.studentId)),
    fullName: "",
    gender: "male" as Gender,
    courseId: db.courses[0]?.id ?? "",
    photoDataUrl: "",
  });

  const [certificateNumber, setCertificateNumber] = useState(certificate?.certificateNumber ?? "");
  const [courseId, setCourseId] = useState(certificate?.courseId ?? db.courses[0]?.id ?? "");
  const [issueDate, setIssueDate] = useState(certificate?.issueDate ?? new Date().toISOString().slice(0, 10));
  const [graduationYear, setGraduationYear] = useState(String(certificate?.graduationYear ?? new Date().getFullYear()));
  const [overallResult, setOverallResult] = useState(certificate?.overallResult ?? "");
  const [grades, setGrades] = useState<GradeEntry[]>(
    certificate?.grades?.length
      ? certificate.grades
      : [{ id: uid("g"), subject: "", result: "" }],
  );
  const [status, setStatus] = useState<CertificateStatus>(certificate?.status ?? "valid");
  const [notes, setNotes] = useState(certificate?.notes ?? "");
  const [error, setError] = useState("");

  const matches = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    if (!q) return db.students.slice(0, 8);
    return db.students
      .filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.studentId.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [db.students, studentQuery]);

  const selectedStudent = studentById(studentId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    let sid = studentId;
    if (mode === "new") {
      if (!newStudent.fullName.trim()) {
        setError("Student full name is required.");
        return;
      }
      const created = await createStudent({
        ...newStudent,
        photoDataUrl: newStudent.photoDataUrl || makePortrait(newStudent.fullName, 200),
      });
      if (created.error || !created.id) {
        setError(created.error ?? "Could not create student.");
        return;
      }
      sid = created.id;
    }
    if (!sid) {
      setError("Select or create a student.");
      return;
    }
    const payload = {
      studentId: sid,
      certificateNumber,
      courseId,
      issueDate,
      graduationYear: Number(graduationYear),
      overallResult,
      grades: grades.filter((g) => g.subject.trim() || g.result.trim()),
      file: null,
      status,
      notes,
    };
    if (certificate) {
      const result = await updateCertificate(certificate.id, payload);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(`/admin/certificates/${certificate.id}`);
      return;
    }
    const result = await createCertificate(payload);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push(`/admin/certificates/${result.id}`);
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      <section className="rounded-2xl border border-line bg-paper p-6">
        <h2 className="font-display text-xl">Student</h2>
        <div className="mt-3 flex gap-2">
          <Button type="button" size="sm" variant={mode === "existing" ? "primary" : "secondary"} onClick={() => setMode("existing")}>
            Existing student
          </Button>
          <Button type="button" size="sm" variant={mode === "new" ? "primary" : "secondary"} onClick={() => setMode("new")}>
            Create new student
          </Button>
        </div>
        {mode === "existing" ? (
          <div className="mt-4 space-y-3">
            <Field label="Search student">
              <Input
                value={studentQuery}
                onChange={(e) => setStudentQuery(e.target.value)}
                placeholder="Name or student ID"
              />
            </Field>
            <div className="grid gap-2 sm:grid-cols-2">
              {matches.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => setStudentId(s.id)}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-left ${studentId === s.id ? "border-teal bg-teal/5" : "border-line"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.photoDataUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                  <span>
                    <span className="block text-sm font-medium">{s.fullName}</span>
                    <span className="font-mono text-xs text-muted">{s.studentId}</span>
                  </span>
                </button>
              ))}
            </div>
            {selectedStudent && (
              <p className="text-sm text-muted">
                Selected: <span className="font-medium text-ink">{selectedStudent.fullName}</span>. The student photograph will appear on public verification.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-[160px_1fr]">
            <PhotoUpload
              value={newStudent.photoDataUrl}
              onChange={(photoDataUrl) => setNewStudent((s) => ({ ...s, photoDataUrl }))}
              maxMb={db.settings.maxPhotoMb}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Student ID">
                <Input
                  value={newStudent.studentId}
                  onChange={(e) => setNewStudent((s) => ({ ...s, studentId: e.target.value }))}
                />
              </Field>
              <Field label="Full name">
                <Input
                  value={newStudent.fullName}
                  onChange={(e) => setNewStudent((s) => ({ ...s, fullName: e.target.value }))}
                />
              </Field>
              <Field label="Gender">
                <Select
                  value={newStudent.gender}
                  onChange={(e) => setNewStudent((s) => ({ ...s, gender: e.target.value as Gender }))}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </Select>
              </Field>
              <Field label="Course">
                <Select
                  value={newStudent.courseId}
                  onChange={(e) => setNewStudent((s) => ({ ...s, courseId: e.target.value }))}
                >
                  {db.courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-paper p-6">
        <h2 className="font-display text-xl">Certificate</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="Certificate number"
            hint="Enter the exact number printed on the Word certificate. It will not be changed."
            error={error === "Certificate number already exists." ? error : undefined}
          >
            <Input
              value={certificateNumber}
              onChange={(e) => setCertificateNumber(e.target.value)}
              placeholder="CILAN-2026-00452"
              className="font-mono"
              required
            />
          </Field>
          <Field label="Course">
            <Select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              {db.courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Issue date">
            <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required />
          </Field>
          <Field label="Graduation year">
            <Input
              type="number"
              value={graduationYear}
              onChange={(e) => setGraduationYear(e.target.value)}
              required
            />
          </Field>
          <Field label="Overall grade / result">
            <Input
              value={overallResult}
              onChange={(e) => setOverallResult(e.target.value)}
              placeholder="Excellent, Very Good, Pass, 85%"
            />
          </Field>
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value as CertificateStatus)}>
              <option value="valid">Valid</option>
              <option value="revoked">Revoked</option>
              <option value="replaced">Replaced</option>
              <option value="archived">Archived</option>
            </Select>
          </Field>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">Academic transcript</p>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setGrades((g) => [...g, { id: uid("g"), subject: "", result: "" }])}
            >
              <Plus className="h-4 w-4" />
              Add subject
            </Button>
          </div>
          <div className="space-y-2">
            {grades.map((g) => (
              <div key={g.id} className="flex gap-2">
                <Input
                  value={g.subject}
                  placeholder="Subject"
                  onChange={(e) =>
                    setGrades((rows) => rows.map((r) => (r.id === g.id ? { ...r, subject: e.target.value } : r)))
                  }
                />
                <Input
                  value={g.result}
                  placeholder="Score or grade"
                  onChange={(e) =>
                    setGrades((rows) => rows.map((r) => (r.id === g.id ? { ...r, result: e.target.value } : r)))
                  }
                />
                <Button type="button" variant="ghost" onClick={() => setGrades((rows) => rows.filter((r) => r.id !== g.id))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-paper p-6">
        <Field label="Private notes" hint="Visible to administrators only.">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-4" />
        </Field>
      </section>

      {error && error !== "Certificate number already exists." && (
        <p className="text-sm text-danger">{error}</p>
      )}
      {error === "Certificate number already exists." && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">
          Certificate number already exists.
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit">{certificate ? "Save certificate" : "Register certificate"}</Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
