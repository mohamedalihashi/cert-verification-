import type { CertificateStatus } from "./types";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function uid(prefix: string) {
  const rand =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${rand}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function formatDate(value: string | number | Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelative(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const delta = Date.now() - date.getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (delta < minute) return "just now";
  if (delta < hour) {
    const n = Math.floor(delta / minute);
    return `${n} min ago`;
  }
  if (delta < day) {
    const n = Math.floor(delta / hour);
    return `${n} hour${n === 1 ? "" : "s"} ago`;
  }
  if (delta < 7 * day) {
    const n = Math.floor(delta / day);
    return `${n} day${n === 1 ? "" : "s"} ago`;
  }
  return formatDate(date);
}

export function percentChange(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function sha256(text: string) {
  const buffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function normalizeCertNumber(value: string) {
  return value.trim();
}

export function certNumbersMatch(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function publicVerifyPath(certificateNumber: string) {
  return `/verify/${encodeURIComponent(certificateNumber.trim())}`;
}

export function publicVerifyUrl(baseUrl: string, certificateNumber: string) {
  const origin = baseUrl.replace(/\/$/, "") || "http://localhost:3000";
  return `${origin}${publicVerifyPath(certificateNumber)}`;
}

export function statusLabel(status: CertificateStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function nextStudentId(existing: string[]) {
  const year = new Date().getFullYear();
  const prefix = `STU-${year}-`;
  let max = 0;
  for (const id of existing) {
    if (!id.startsWith(prefix)) continue;
    const n = Number(id.slice(prefix.length));
    if (!Number.isNaN(n)) max = Math.max(max, n);
  }
  return `${prefix}${String(max + 1).padStart(5, "0")}`;
}

export function fileExtension(name: string) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

export const PHOTO_ACCEPT = ".jpg,.jpeg,.png,.webp";
export const PHOTO_MIMES = ["image/jpeg", "image/png", "image/webp"];
export const PHOTO_EXTS = [".jpg", ".jpeg", ".png", ".webp"];

export const CERT_ACCEPT = ".pdf,.jpg,.jpeg,.png,.docx";
export const CERT_MIMES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
export const CERT_EXTS = [".pdf", ".jpg", ".jpeg", ".png", ".docx"];

export function validateUpload(file: File, kind: "photo" | "certificate", maxMb: number) {
  const ext = fileExtension(file.name);
  const allowedExts = kind === "photo" ? PHOTO_EXTS : CERT_EXTS;
  const allowedMimes = kind === "photo" ? PHOTO_MIMES : CERT_MIMES;
  if (!allowedExts.includes(ext)) {
    return `Unsupported file type. Allowed: ${allowedExts.join(", ")}`;
  }
  if (file.type && !allowedMimes.includes(file.type) && file.type !== "image/jpg") {
    return "File MIME type is not allowed.";
  }
  if (file.size > maxMb * 1024 * 1024) {
    return `File is too large. Maximum size is ${maxMb} MB.`;
  }
  return null;
}

export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const RATE_KEY = "cilan-verify-rate";
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 8;

export function checkVerifyRateLimit() {
  const now = Date.now();
  let stamps: number[] = [];
  try {
    stamps = JSON.parse(sessionStorage.getItem(RATE_KEY) || "[]");
  } catch {
    stamps = [];
  }
  stamps = stamps.filter((t) => now - t < RATE_WINDOW_MS);
  if (stamps.length >= RATE_MAX) {
    return {
      allowed: false,
      message: "Too many verification attempts. Please wait a moment and try again.",
    };
  }
  stamps.push(now);
  sessionStorage.setItem(RATE_KEY, JSON.stringify(stamps));
  return { allowed: true, message: "" };
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "NA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function makePortrait(name: string, hue: number) {
  const letters = initials(name);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="hsl(${hue},42%,32%)"/>
        <stop offset="100%" stop-color="hsl(${hue},40%,16%)"/>
      </linearGradient>
    </defs>
    <rect width="256" height="256" fill="url(#g)"/>
    <circle cx="128" cy="128" r="116" fill="none" stroke="hsla(40,55%,72%,0.4)" stroke-width="3"/>
    <text x="128" y="150" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="84" font-weight="600" fill="#f6e7c1">${letters}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export function copyText(text: string) {
  return navigator.clipboard.writeText(text);
}
