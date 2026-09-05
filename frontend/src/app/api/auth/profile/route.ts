import { proxyAuth } from "@/lib/auth-proxy";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  return proxyAuth(req, "profile");
}

export async function PATCH(req: NextRequest) {
  return proxyAuth(req, "profile");
}
