// app/api/health/route.ts
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  return Response.json({ ok: true, status: "healthy", ts: Date.now() });
}
