"use client";

import { ConfirmDialog } from "@/components/dialogs";
import { Button, PageHeader, StatusBadge, TableWrap, Td, Th } from "@/components/ui";
import { useApp } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function StudentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { studentById, courseById, certificatesForStudent, deleteStudent, isSuperAdmin } = useApp();
  const student = studentById(id);
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);

  if (!student) return <p className="text-muted">Student not found.</p>;
  const certs = certificatesForStudent(student.id);

  return (
    <div>
      <PageHeader
        title={student.fullName}
        description={student.studentId}
        actions={
          <>
            <Link href={`/admin/students/${student.id}/edit`}>
              <Button variant="secondary">Edit</Button>
            </Link>
            <Link href={`/admin/certificates/new?studentId=${student.id}`}>
              <Button>Add certificate</Button>
            </Link>
            {isSuperAdmin && (
              <Button variant="danger" onClick={() => setConfirm(true)}>
                Delete
              </Button>
            )}
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        <div className="rounded-2xl border border-line bg-paper p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={student.photoDataUrl} alt={student.fullName} className="h-44 w-full rounded-xl object-cover" />
          <dl className="mt-4 space-y-2 text-sm">
            <div>
              <dt className="text-xs text-muted">Gender</dt>
              <dd className="capitalize">{student.gender}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Course</dt>
              <dd>{courseById(student.courseId)?.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Created</dt>
              <dd>{formatDate(student.createdAt)}</dd>
            </div>
          </dl>
        </div>
        <div>
          <h2 className="font-display text-2xl">Certificates</h2>
          <p className="mb-4 text-sm text-muted">All credentials remain connected to this student profile.</p>
          <TableWrap>
            <thead>
              <tr>
                <Th>Number</Th>
                <Th>Course</Th>
                <Th>Year</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {certs.map((c) => (
                <tr key={c.id}>
                  <Td>
                    <Link href={`/admin/certificates/${c.id}`} className="font-mono text-teal hover:underline">
                      {c.certificateNumber}
                    </Link>
                  </Td>
                  <Td>{courseById(c.courseId)?.name}</Td>
                  <Td>{c.graduationYear}</Td>
                  <Td>
                    <StatusBadge status={c.status} />
                  </Td>
                </tr>
              ))}
              {certs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-sm text-muted">
                    No certificates yet.
                  </td>
                </tr>
              )}
            </tbody>
          </TableWrap>
        </div>
      </div>
      <ConfirmDialog
        open={confirm}
        title="Delete student?"
        description="This cannot be undone. Students with certificates cannot be deleted."
        confirmLabel="Delete"
        danger
        onClose={() => setConfirm(false)}
        onConfirm={async () => {
          const err = await deleteStudent(student.id);
          setConfirm(false);
          if (!err) router.push("/admin/students");
        }}
      />
    </div>
  );
}
