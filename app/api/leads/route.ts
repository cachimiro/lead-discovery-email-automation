import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/leads?query=&domain=&limit=50&cursor=<created_at_iso>
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const query = (url.searchParams.get("query") || "").trim();
  const domain = (url.searchParams.get("domain") || "").trim();
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 200);
  const cursor = url.searchParams.get("cursor");

  const supabase = supabaseAdmin();

  let q = supabase
    .from("leads")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) q = q.lt("created_at", cursor);
  if (domain) q = q.eq("company_domain", domain);
  if (query) {
    q = q.or(`email.ilike.%${query}%,full_name.ilike.%${query}%,title.ilike.%${query}%`);
  }

  const { data, error } = await q;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const nextCursor = data && data.length === limit ? data[data.length - 1].created_at : null;
  return Response.json({ items: data ?? [], nextCursor });
}

// DELETE /api/leads?id=<uuid>
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  const supabase = supabaseAdmin();
  const { error } = await supabase.from("leads").delete().eq("id", id).eq("user_id", session.user.id);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}
