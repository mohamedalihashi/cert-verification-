"use client";

import { RoleGate } from "@/components/admin-shell";
import { Input, PageHeader, Select, TableWrap, Td, Th } from "@/components/ui";
import { useApp } from "@/lib/store";
import { formatDateTime } from "@/lib/utils";
import { useMemo, useState } from "react";

export default function LogsPage() {
  return (
    <RoleGate allow="super_admin">
      <LogsInner />
    </RoleGate>
  );
}

function LogsInner() {
  const { db } = useApp();
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const rows = useMemo(() => {
    return db.logs.filter((l) => {
      if (type && l.recordType !== type) return false;
      const query = q.trim().toLowerCase();
      if (!query) return true;
      return (
        l.action.toLowerCase().includes(query) ||
        l.userName.toLowerCase().includes(query) ||
        l.recordId.toLowerCase().includes(query)
      );
    });
  }, [db.logs, q, type]);

  return (
    <div>
      <PageHeader title="Activity logs" description="Important administrator actions are recorded here." />
      <div className="mb-4 flex flex-wrap gap-3">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search action, user, or record" className="max-w-sm" />
        <Select value={type} onChange={(e) => setType(e.target.value)} className="max-w-xs">
          <option value="">All record types</option>
          <option value="session">Session</option>
          <option value="student">Student</option>
          <option value="certificate">Certificate</option>
          <option value="course">Course</option>
          <option value="user">User</option>
          <option value="settings">Settings</option>
        </Select>
      </div>
      <TableWrap>
        <thead>
          <tr>
            <Th>Date / time</Th>
            <Th>User</Th>
            <Th>Action</Th>
            <Th>Record type</Th>
            <Th>Record ID</Th>
            <Th>IP</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((l) => (
            <tr key={l.id}>
              <Td className="whitespace-nowrap">{formatDateTime(l.createdAt)}</Td>
              <Td>{l.userName}</Td>
              <Td>{l.action}</Td>
              <Td className="capitalize">{l.recordType}</Td>
              <Td className="font-mono text-xs">{l.recordId}</Td>
              <Td className="text-xs text-muted">{l.ipAddress}</Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </div>
  );
}
