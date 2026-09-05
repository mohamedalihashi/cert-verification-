export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(path, { credentials: "include", ...init, headers });
  const data = (await res.json().catch(() => ({}))) as {
    message?: string | string[];
    error?: string;
  };
  if (!res.ok) {
    const raw = Array.isArray(data.message)
      ? data.message[0]
      : data.message || data.error || "";
    const fallback =
      res.status === 401
        ? "Please sign in again."
        : res.status === 404
          ? "This action is not available. Restart the API server."
          : res.statusText || "Request failed.";
    throw new ApiError(raw || fallback, res.status);
  }
  return data as T;
}

export function dataUrlToFile(dataUrl: string, filename: string) {
  const [head, body] = dataUrl.split(",");
  const mime = /:(.*?);/.exec(head)?.[1] ?? "image/jpeg";
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}
