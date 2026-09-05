"use client";

import { Button, PageHeader, StatusBadge, TableWrap, Td, Th } from "@/components/ui";
import { ACADEMY_NAME } from "@/lib/brand";
import { useApp } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import { Download, Printer } from "lucide-react";

export default function ReportsPage() {
  const { db, studentById, courseById } = useApp();
  const valid = db.certificates.filter((c) => c.status === "valid").length;
  const revoked = db.certificates.filter((c) => c.status === "revoked").length;
  const year = new Date().getFullYear();
  const issuedThisYear = db.certificates.filter((c) => new Date(c.issueDate).getFullYear() === year).length;

  function csv() {
    const header = ["Certificate Number", "Student", "Course", "Issue Date", "Graduation Year", "Status"];
    const rows = db.certificates.map((c) => [
      c.certificateNumber,
      studentById(c.studentId)?.fullName ?? "",
      courseById(c.courseId)?.name ?? "",
      c.issueDate,
      String(c.graduationYear),
      c.status,
    ]);
    const body = [header, ...rows]
      .map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "horseed-certificates.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        description={`${ACADEMY_NAME} certificate registry summary.`}
        actions={
          <>
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button onClick={csv}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Summary label="Students" value={db.students.length} />
        <Summary label="Certificates" value={db.certificates.length} />
        <Summary label={`Issued in ${year}`} value={issuedThisYear} />
        <Summary label="Valid / Revoked" value={`${valid} / ${revoked}`} />
      </div>
      <TableWrap>
        <thead>
          <tr>
            <Th>Certificate</Th>
            <Th>Student</Th>
            <Th>Course</Th>
            <Th>Issue date</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {[...db.certificates]
            .sort((a, b) => b.issueDate.localeCompare(a.issueDate))
            .map((c) => (
              <tr key={c.id}>
                <Td className="font-mono text-sm">{c.certificateNumber}</Td>
                <Td>{studentById(c.studentId)?.fullName ?? "—"}</Td>
                <Td>{courseById(c.courseId)?.name ?? "—"}</Td>
                <Td>{formatDate(c.issueDate)}</Td>
                <Td>
                  <StatusBadge status={c.status} />
                </Td>
              </tr>
            ))}
        </tbody>
      </TableWrap>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl">{value}</p>
    </div>
  );
}
