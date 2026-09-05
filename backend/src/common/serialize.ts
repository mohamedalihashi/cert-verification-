import type { Certificate, Course, Settings, Student, User } from '@prisma/client';

export function toIso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export function serializeUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: toIso(user.createdAt),
  };
}

export function serializeCourse(course: Course) {
  return {
    id: course.id,
    name: course.name,
    code: course.code,
    department: course.department,
    description: course.description,
    status: course.status,
    createdAt: toIso(course.createdAt),
    updatedAt: toIso(course.updatedAt),
  };
}

export function serializeStudent(student: Student) {
  return {
    id: student.id,
    studentId: student.studentId,
    fullName: student.fullName,
    photoDataUrl: student.photoPath ? `/api/files/students/${student.id}/photo` : '',
    gender: student.gender,
    courseId: student.courseId,
    createdAt: toIso(student.createdAt),
    updatedAt: toIso(student.updatedAt),
  };
}

export function serializeCertificate(cert: Certificate) {
  const raw = cert.grades as unknown;
  let grades: { id: string; subject: string; result: string }[] = [];
  if (Array.isArray(raw)) {
    grades = raw as { id: string; subject: string; result: string }[];
  } else if (typeof raw === "string") {
    try {
      grades = JSON.parse(raw || "[]");
    } catch {
      grades = [];
    }
  }
  return {
    id: cert.id,
    studentId: cert.studentId,
    certificateNumber: cert.certificateNumber,
    courseId: cert.courseId,
    issueDate: cert.issueDate.toISOString().slice(0, 10),
    graduationYear: cert.graduationYear,
    overallResult: cert.overallResult,
    grades,
    file: cert.fileName
      ? {
          name: cert.fileName,
          mimeType: cert.fileMimeType ?? 'application/octet-stream',
          size: cert.fileSize ?? 0,
          dataUrl: null,
        }
      : null,
    status: cert.status,
    notes: cert.notes,
    createdBy: cert.createdById,
    createdAt: toIso(cert.createdAt),
    updatedAt: toIso(cert.updatedAt),
  };
}

export function serializeSettings(settings: Settings) {
  return {
    schoolName: settings.schoolName,
    schoolShortName: settings.schoolShortName,
    tagline: settings.tagline,
    address: settings.address,
    phone: settings.phone,
    email: settings.email,
    website: settings.website,
    publicBaseUrl: settings.publicBaseUrl,
    maxCertFileMb: settings.maxCertFileMb,
    maxPhotoMb: settings.maxPhotoMb,
  };
}

export function serializeLog(log: {
  id: string;
  userId: string;
  userName: string;
  action: string;
  recordType: string;
  recordId: string;
  ipAddress: string;
  createdAt: Date;
}) {
  return {
    id: log.id,
    userId: log.userId,
    userName: log.userName,
    action: log.action,
    recordType: log.recordType,
    recordId: log.recordId,
    ipAddress: log.ipAddress,
    createdAt: toIso(log.createdAt),
  };
}

export function clientIp(req: { ip?: string; headers: Record<string, unknown> }) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) return forwarded.split(',')[0].trim();
  return req.ip ?? 'unknown';
}
