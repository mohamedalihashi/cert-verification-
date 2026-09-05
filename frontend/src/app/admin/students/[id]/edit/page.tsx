"use client";

import { StudentForm } from "@/components/student-form";
import { PageHeader } from "@/components/ui";
import { useApp } from "@/lib/store";
import { useParams } from "next/navigation";

export default function EditStudentPage() {
  const { id } = useParams<{ id: string }>();
  const { studentById } = useApp();
  const student = studentById(id);
  if (!student) return <p className="text-muted">Student not found.</p>;
  return (
    <div>
      <PageHeader title="Edit Student" description={student.fullName} />
      <div className="rounded-2xl border border-line bg-paper p-6">
        <StudentForm student={student} />
      </div>
    </div>
  );
}
