"use client";

import { CourseForm } from "@/components/course-form";
import { PageHeader } from "@/components/ui";
import { useApp } from "@/lib/store";
import { useParams } from "next/navigation";

export default function EditCoursePage() {
  const { id } = useParams<{ id: string }>();
  const { courseById } = useApp();
  const course = courseById(id);
  if (!course) return <p className="text-muted">Course not found.</p>;
  return (
    <div>
      <PageHeader title="Edit Course" description={course.name} />
      <CourseForm course={course} />
    </div>
  );
}
