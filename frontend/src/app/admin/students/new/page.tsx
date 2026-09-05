"use client";

import { StudentForm } from "@/components/student-form";
import { PageHeader } from "@/components/ui";

export default function NewStudentPage() {
  return (
    <div>
      <PageHeader title="Add Student" description="The student photograph is reused on all certificates." />
      <div className="rounded-2xl border border-line bg-paper p-6">
        <StudentForm />
      </div>
    </div>
  );
}
