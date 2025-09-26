// app/api/leads/[id]/route.ts
import type { NextRequest } from "next/server";
export const runtime = "nodejs";

// Optional placeholder handlers so the module is valid
export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  return Response.json({ error: "Not implemented", id: params.id }, { status: 501 });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return Response.json({ error: "Not implemented", id: params.id }, { status: 501 });
}
