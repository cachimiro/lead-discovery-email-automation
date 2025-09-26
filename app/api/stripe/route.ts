// app/api/stripe/webhook/route.ts
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

// Temporary stub
export async function POST(_req: NextRequest) {
  // Respond 200 so Stripe doesn’t retry if someone hits this by mistake
  return new Response("ok", { status: 200 });
}
