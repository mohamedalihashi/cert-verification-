import { NextRequest, NextResponse } from "next/server";

const API = process.env.API_PROXY_URL ?? "http://localhost:4000";

export async function proxyAuth(req: NextRequest, path: "profile" | "password") {
  const cookie = req.headers.get("cookie") ?? "";
  const body = await req.text();
  let res: Response;
  try {
    res = await fetch(`${API}/api/auth/${path}`, {
      method: req.method,
      headers: {
        "content-type": req.headers.get("content-type") ?? "application/json",
        cookie,
      },
      body: body || undefined,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { message: "Cannot reach the API server. Start the backend on port 4000." },
      { status: 502 },
    );
  }
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
    },
  });
}
