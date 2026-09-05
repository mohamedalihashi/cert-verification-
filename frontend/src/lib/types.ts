export type UserRole = "super_admin" | "staff";
export type UserStatus = "active" | "disabled";
export type Gender = "male" | "female" | "other";
export type CourseStatus = "active" | "inactive";
export type CertificateStatus = "valid" | "revoked" | "replaced" | "archived";

export type GradeEntry = {
  id: string;
  subject: string;
  result: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  passwordHash: string;
  createdAt: string;
};

export type Course = {
  id: string;
  name: string;
  code: string;
  department: string;
  description: string;
  status: CourseStatus;
  createdAt: string;
  updatedAt: string;
};

export type Student = {
  id: string;
  studentId: string;
  fullName: string;
  photoDataUrl: string;
  gender: Gender;
  courseId: string;
  createdAt: string;
  updatedAt: string;
};

export type CertificateFile = {
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string | null;
  sessionOnly?: boolean;
};

export type Certificate = {
  id: string;
  studentId: string;
  certificateNumber: string;
  courseId: string;
  issueDate: string;
  graduationYear: number;
  grades: GradeEntry[];
  overallResult: string;
  file: CertificateFile | null;
  status: CertificateStatus;
  notes: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type ActivityLog = {
  id: string;
  userId: string;
  userName: string;
  action: string;
  recordType: string;
  recordId: string;
  ipAddress: string;
  createdAt: string;
};

export type Settings = {
  schoolName: string;
  schoolShortName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  publicBaseUrl: string;
  maxCertFileMb: number;
  maxPhotoMb: number;
};

export type Database = {
  users: User[];
  courses: Course[];
  students: Student[];
  certificates: Certificate[];
  logs: ActivityLog[];
  settings: Settings;
};

export type CertificateFilters = {
  query?: string;
  courseId?: string;
  year?: string;
  status?: CertificateStatus | "";
  issueDate?: string;
};
