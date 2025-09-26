// app/api/checkout/route.ts
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

// Temporary stub until Stripe is wired
export async function POST(_req: NextRequest) {
  return Response.json(
    { error: "Checkout not implemented yet" },
    { status: 501 }
  );
}
