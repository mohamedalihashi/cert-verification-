"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, ApiError, dataUrlToFile } from "./api";
import { ACADEMY_SETTINGS, withAcademyBrand } from "./brand";
import type {
  ActivityLog,
  Certificate,
  CertificateFilters,
  CertificateStatus,
  Course,
  Database,
  Settings,
  Student,
  User,
  UserRole,
} from "./types";
import { certNumbersMatch, uid } from "./utils";

type Toast = { id: string; kind: "success" | "error" | "info"; message: string };
type LoginResult = { ok: true } | { ok: false; error: string };

const emptyDb = (): Database => ({
  users: [],
  courses: [],
  students: [],
  certificates: [],
  logs: [],
  settings: {
    ...ACADEMY_SETTINGS,
    address: "",
    phone: "",
    email: "",
    website: "",
    publicBaseUrl: "",
    maxCertFileMb: 8,
    maxPhotoMb: 5,
  },
});

type AppContextValue = {
  hydrated: boolean;
  db: Database;
  currentUser: User | null;
  toasts: Toast[];
  dismissToast: (id: string) => void;
  toast: (kind: Toast["kind"], message: string) => void;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  isSuperAdmin: boolean;
  log: (action: string, recordType: string, recordId: string) => void;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  createUser: (input: {
    name: string;
    email: string;
    role: UserRole;
    password: string;
  }) => Promise<string | null>;
  setUserStatus: (id: string, status: User["status"]) => Promise<string | null>;
  resetUserPassword: (id: string, password: string) => Promise<string | null>;
  updateProfile: (input: { name: string; email: string }) => Promise<string | null>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<string | null>;
  createCourse: (input: Omit<Course, "id" | "createdAt" | "updatedAt">) => Promise<string | null>;
  updateCourse: (id: string, patch: Partial<Course>) => Promise<string | null>;
  createStudent: (
    input: Omit<Student, "id" | "createdAt" | "updatedAt">,
  ) => Promise<{ error?: string; id?: string }>;
  updateStudent: (id: string, patch: Partial<Student>) => Promise<string | null>;
  deleteStudent: (id: string) => Promise<string | null>;
  createCertificate: (
    input: Omit<Certificate, "id" | "createdAt" | "updatedAt" | "createdBy" | "certificateNumber"> & {
      certificateNumber: string;
    },
  ) => Promise<{ id?: string; error?: string }>;
  updateCertificate: (id: string, patch: Partial<Certificate>) => Promise<{ error?: string }>;
  setCertificateStatus: (id: string, status: CertificateStatus, action: string) => Promise<void>;
  deleteCertificate: (id: string) => Promise<void>;
  findCertificateByNumber: (number: string) => Certificate | undefined;
  searchCertificates: (filters: CertificateFilters) => Certificate[];
  studentById: (id: string) => Student | undefined;
  courseById: (id: string) => Course | undefined;
  userById: (id: string) => User | undefined;
  certificatesForStudent: (studentId: string) => Certificate[];
  refresh: () => Promise<void>;
  publicCounts: { students: number; certificates: number; courses: number };
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [db, setDb] = useState<Database>(emptyDb);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [publicCounts, setPublicCounts] = useState({ students: 0, certificates: 0, courses: 0 });

  const toast = useCallback((kind: Toast["kind"], message: string) => {
    const id = uid("toast");
    setToasts((prev) => [...prev, { id, kind, message }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const applyBootstrap = useCallback(
    (payload: {
      user: User;
      students: Student[];
      courses: Course[];
      certificates: Certificate[];
      settings: Settings | null;
      users?: User[];
      logs?: ActivityLog[];
    }) => {
      setCurrentUser(payload.user);
      setDb((prev) => ({
        students: payload.students,
        courses: payload.courses,
        certificates: payload.certificates,
        users: payload.users ?? prev.users,
        logs: payload.logs ?? prev.logs,
        settings: payload.settings ? withAcademyBrand(payload.settings) : prev.settings,
      }));
    },
    [],
  );

  const refresh = useCallback(async () => {
    const payload = await api<Parameters<typeof applyBootstrap>[0]>("/api/bootstrap");
    applyBootstrap(payload);
  }, [applyBootstrap]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const meta = await api<{ settings: Settings | null }>("/api/public/meta");
        const stats = await api<{ students: number; certificates: number; courses: number }>(
          "/api/public/stats",
        );
        if (cancelled) return;
        if (meta.settings) {
          setDb((prev) => ({ ...prev, settings: withAcademyBrand(meta.settings as Settings) }));
        }
        setPublicCounts(stats);
      } catch {
        /* API offline */
      }
      try {
        await api<{ user: User }>("/api/auth/me");
        if (cancelled) return;
        const payload = await api<Parameters<typeof applyBootstrap>[0]>("/api/bootstrap");
        if (!cancelled) applyBootstrap(payload);
      } catch {
        /* Stay logged out. Do not clear a login that finished while this check was in flight. */
      }
      if (!cancelled) setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [applyBootstrap]);

  const isSuperAdmin = currentUser?.role === "super_admin";

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      try {
        const data = await api<{ user: User }>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        setCurrentUser(data.user);
        try {
          await refresh();
        } catch {
          /* Cookie is set; dashboard data can load on the next refresh. */
        }
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "Login failed." };
      }
    },
    [refresh],
  );

  const logout = useCallback(() => {
    void api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    setCurrentUser(null);
  }, []);

  const log = useCallback((_action: string, _recordType: string, _recordId: string) => {
    /* recorded by the API */
  }, []);

  const wrap = useCallback(
    async (fn: () => Promise<void>, success: string) => {
      try {
        await fn();
        await refresh();
        toast("success", success);
        return null;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Request failed.";
        toast("error", message);
        return message;
      }
    },
    [refresh, toast],
  );

  const updateSettings = useCallback(
    async (patch: Partial<Settings>) => {
      await wrap(
        () => api("/api/settings", { method: "PATCH", body: JSON.stringify(patch) }),
        "Settings saved.",
      );
    },
    [wrap],
  );

  const createUser = useCallback(
    async (input: { name: string; email: string; role: UserRole; password: string }) => {
      return wrap(
        () => api("/api/users", { method: "POST", body: JSON.stringify(input) }),
        "Administrator created.",
      );
    },
    [wrap],
  );

  const setUserStatus = useCallback(
    async (id: string, status: User["status"]) => {
      return wrap(
        () =>
          api(`/api/users/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
        status === "disabled" ? "Administrator disabled." : "Administrator enabled.",
      );
    },
    [wrap],
  );

  const resetUserPassword = useCallback(
    async (id: string, password: string) => {
      return wrap(
        () =>
          api(`/api/users/${id}/password`, { method: "PATCH", body: JSON.stringify({ password }) }),
        "Password updated.",
      );
    },
    [wrap],
  );

  const updateProfile = useCallback(
    async (input: { name: string; email: string }) => {
      try {
        const data = await api<{ user: User }>("/api/auth/profile", {
          method: "POST",
          body: JSON.stringify({
            name: input.name.trim(),
            email: input.email.trim(),
          }),
        });
        setCurrentUser((prev) => (prev ? { ...prev, ...data.user } : data.user));
        setDb((prev) => ({
          ...prev,
          users: prev.users.map((u) => (u.id === data.user.id ? { ...u, ...data.user } : u)),
        }));
        toast("success", "Profile saved.");
        return null;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not save profile.";
        toast("error", message);
        return message;
      }
    },
    [toast],
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      try {
        await api("/api/auth/password", {
          method: "POST",
          body: JSON.stringify({ currentPassword, newPassword }),
        });
        toast("success", "Password changed.");
        return null;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not change password.";
        toast("error", message);
        return message;
      }
    },
    [toast],
  );

  const createCourse = useCallback(
    async (input: Omit<Course, "id" | "createdAt" | "updatedAt">) => {
      return wrap(
        () => api("/api/courses", { method: "POST", body: JSON.stringify(input) }),
        "Course created.",
      );
    },
    [wrap],
  );

  const updateCourse = useCallback(
    async (id: string, patch: Partial<Course>) => {
      return wrap(
        () => api(`/api/courses/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
        "Course updated.",
      );
    },
    [wrap],
  );

  const studentForm = useCallback((input: Partial<Student>) => {
    const form = new FormData();
    if (input.studentId) form.set("studentId", input.studentId);
    if (input.fullName) form.set("fullName", input.fullName);
    if (input.gender) form.set("gender", input.gender);
    if (input.courseId) form.set("courseId", input.courseId);
    if (input.photoDataUrl?.startsWith("data:")) {
      form.set("photo", dataUrlToFile(input.photoDataUrl, "photo.jpg"));
    }
    return form;
  }, []);

  const createStudent = useCallback(
    async (input: Omit<Student, "id" | "createdAt" | "updatedAt">) => {
      try {
        const result = await api<{ student: Student }>("/api/students", {
          method: "POST",
          body: studentForm(input),
        });
        await refresh();
        toast("success", "Student created.");
        return { id: result.student.id };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Request failed.";
        toast("error", message);
        return { error: message };
      }
    },
    [refresh, studentForm, toast],
  );

  const updateStudent = useCallback(
    async (id: string, patch: Partial<Student>) => {
      return wrap(async () => {
        await api(`/api/students/${id}`, { method: "PATCH", body: studentForm(patch) });
      }, "Student updated.");
    },
    [studentForm, wrap],
  );

  const deleteStudent = useCallback(
    async (id: string) => {
      return wrap(() => api(`/api/students/${id}`, { method: "DELETE" }), "Student deleted.");
    },
    [wrap],
  );

  const certForm = useCallback((input: Partial<Certificate> & { certificateNumber?: string }) => {
    return {
      ...(input.studentId ? { studentId: input.studentId } : {}),
      ...(input.certificateNumber ? { certificateNumber: input.certificateNumber } : {}),
      ...(input.courseId ? { courseId: input.courseId } : {}),
      ...(input.issueDate ? { issueDate: input.issueDate } : {}),
      ...(input.graduationYear ? { graduationYear: input.graduationYear } : {}),
      ...(input.overallResult !== undefined ? { overallResult: input.overallResult } : {}),
      ...(input.grades ? { grades: JSON.stringify(input.grades) } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    };
  }, []);

  const createCertificate = useCallback(
    async (
      input: Omit<Certificate, "id" | "createdAt" | "updatedAt" | "createdBy" | "certificateNumber"> & {
        certificateNumber: string;
      },
    ) => {
      try {
        const result = await api<{ certificate: Certificate }>("/api/certificates", {
          method: "POST",
          body: JSON.stringify(certForm(input)),
        });
        await refresh();
        toast("success", "Certificate registered.");
        return { id: result.certificate.id };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Request failed.";
        if (message === "Certificate number already exists.") {
          return { error: message };
        }
        toast("error", message);
        return { error: message };
      }
    },
    [certForm, refresh, toast],
  );

  const updateCertificate = useCallback(
    async (id: string, patch: Partial<Certificate>) => {
      try {
        await api(`/api/certificates/${id}`, { method: "PATCH", body: JSON.stringify(certForm(patch)) });
        await refresh();
        toast("success", "Certificate updated.");
        return {};
      } catch (err) {
        const message = err instanceof Error ? err.message : "Request failed.";
        if (message === "Certificate number already exists.") return { error: message };
        toast("error", message);
        return { error: message };
      }
    },
    [certForm, refresh, toast],
  );

  const setCertificateStatus = useCallback(
    async (id: string, status: CertificateStatus, action: string) => {
      const path =
        status === "revoked"
          ? `/api/certificates/${id}/revoke`
          : status === "archived"
            ? `/api/certificates/${id}/archive`
            : `/api/certificates/${id}/restore`;
      await wrap(() => api(path, { method: "POST" }), `${action}.`);
    },
    [wrap],
  );

  const deleteCertificate = useCallback(
    async (id: string) => {
      await wrap(() => api(`/api/certificates/${id}`, { method: "DELETE" }), "Certificate deleted.");
    },
    [wrap],
  );

  const findCertificateByNumber = useCallback(
    (number: string) => db.certificates.find((c) => certNumbersMatch(c.certificateNumber, number)),
    [db.certificates],
  );

  const searchCertificates = useCallback(
    (filters: CertificateFilters) => {
      const q = filters.query?.trim().toLowerCase() ?? "";
      return db.certificates.filter((c) => {
        const student = db.students.find((s) => s.id === c.studentId);
        const course = db.courses.find((x) => x.id === c.courseId);
        if (filters.courseId && c.courseId !== filters.courseId) return false;
        if (filters.year && String(c.graduationYear) !== filters.year) return false;
        if (filters.status && c.status !== filters.status) return false;
        if (filters.issueDate && c.issueDate !== filters.issueDate) return false;
        if (!q) return true;
        return (
          c.certificateNumber.toLowerCase().includes(q) ||
          (student?.fullName.toLowerCase().includes(q) ?? false) ||
          (course?.name.toLowerCase().includes(q) ?? false)
        );
      });
    },
    [db.certificates, db.courses, db.students],
  );

  const studentById = useCallback((id: string) => db.students.find((s) => s.id === id), [db.students]);
  const courseById = useCallback((id: string) => db.courses.find((c) => c.id === id), [db.courses]);
  const userById = useCallback((id: string) => db.users.find((u) => u.id === id), [db.users]);
  const certificatesForStudent = useCallback(
    (studentId: string) => db.certificates.filter((c) => c.studentId === studentId),
    [db.certificates],
  );

  const value: AppContextValue = {
    hydrated,
    db,
    currentUser,
    toasts,
    dismissToast,
    toast,
    login,
    logout,
    isSuperAdmin,
    log,
    updateSettings,
    createUser,
    setUserStatus,
    resetUserPassword,
    updateProfile,
    changePassword,
    createCourse,
    updateCourse,
    createStudent,
    updateStudent,
    deleteStudent,
    createCertificate,
    updateCertificate,
    setCertificateStatus,
    deleteCertificate,
    findCertificateByNumber,
    searchCertificates,
    studentById,
    courseById,
    userById,
    certificatesForStudent,
    refresh,
    publicCounts,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export { ApiError };
