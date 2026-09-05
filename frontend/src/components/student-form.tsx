"use client";

import { PhotoUpload } from "@/components/photo-upload";
import { Button, Field, Input, Select } from "@/components/ui";
import { useApp } from "@/lib/store";
import type { Gender, Student } from "@/lib/types";
import { makePortrait, nextStudentId } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export function StudentForm({ student }: { student?: Student }) {
  const { db, createStudent, updateStudent } = useApp();
  const router = useRouter();
  const generatedId = useMemo(
    () => student?.studentId ?? nextStudentId(db.students.map((s) => s.studentId)),
    [db.students, student?.studentId],
  );
  const [studentId, setStudentId] = useState(generatedId);
  const [fullName, setFullName] = useState(student?.fullName ?? "");
  const [gender, setGender] = useState<Gender>(student?.gender ?? "male");
  const [courseId, setCourseId] = useState(student?.courseId ?? db.courses[0]?.id ?? "");
  const [photo, setPhoto] = useState(student?.photoDataUrl ?? "");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    const photoDataUrl = photo || makePortrait(fullName, 192);
    if (student) {
      const err = await updateStudent(student.id, {
        studentId,
        fullName,
        gender,
        courseId,
        photoDataUrl,
      });
      if (err) {
        setError(err);
        return;
      }
      router.push(`/admin/students/${student.id}`);
      return;
    }
    const result = await createStudent({
      studentId,
      fullName,
      gender,
      courseId,
      photoDataUrl,
    });
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push(`/admin/students/${result.id}`);
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[180px_1fr]">
      <PhotoUpload
        value={photo}
        onChange={setPhoto}
        maxMb={db.settings.maxPhotoMb}
        name={fullName}
      />
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Student ID">
            <Input value={studentId} onChange={(e) => setStudentId(e.target.value)} required />
          </Field>
          <Field label="Full name">
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </Field>
          <Field label="Gender">
            <Select value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </Select>
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
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit">{student ? "Save student" : "Create student"}</Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
