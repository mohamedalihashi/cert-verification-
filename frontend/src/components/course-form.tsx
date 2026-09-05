"use client";

import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { useApp } from "@/lib/store";
import type { Course, CourseStatus } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CourseForm({ course }: { course?: Course }) {
  const { createCourse, updateCourse } = useApp();
  const router = useRouter();
  const [name, setName] = useState(course?.name ?? "");
  const [code, setCode] = useState(course?.code ?? "");
  const [department, setDepartment] = useState(course?.department ?? "");
  const [description, setDescription] = useState(course?.description ?? "");
  const [status, setStatus] = useState<CourseStatus>(course?.status ?? "active");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { name, code, department, description, status };
    const err = course ? await updateCourse(course.id, payload) : await createCourse(payload);
    if (err) {
      setError(err);
      return;
    }
    router.push("/admin/courses");
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-4 rounded-2xl border border-line bg-paper p-6">
      <Field label="Course name">
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>
      <Field label="Course code">
        <Input value={code} onChange={(e) => setCode(e.target.value)} required className="font-mono" />
      </Field>
      <Field label="Department / category">
        <Input value={department} onChange={(e) => setDepartment(e.target.value)} required />
      </Field>
      <Field label="Description">
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <Field label="Status">
        <Select value={status} onChange={(e) => setStatus(e.target.value as CourseStatus)}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </Field>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit">{course ? "Save course" : "Create course"}</Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/admin/courses")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
