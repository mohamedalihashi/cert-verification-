"use client";

import { CourseForm } from "@/components/course-form";
import { PageHeader } from "@/components/ui";

export default function NewCoursePage() {
  return (
    <div>
      <PageHeader title="Add Course" />
      <CourseForm />
    </div>
  );
}
