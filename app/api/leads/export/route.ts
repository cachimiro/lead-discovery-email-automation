import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const domain = (url.searchParams.get("domain") || "").trim();
  const query = (url.searchParams.get("query") || "").trim();

  const sb = supabaseAdmin();
  let q = sb.from("leads")
    .select("full_name,email,title,company_name,company_domain,neverbounce_result,verified_at")
    .order("created_at", { ascending: false });

  if (domain) q = q.eq("company_domain", domain);
  if (query) q = q.or(`email.ilike.%${query}%,full_name.ilike.%${query}%,title.ilike.%${query}%`);

  const { data, error } = await q;
  if (error) return new Response(error.message, { status: 500 });

  const header = ["full_name","email","title","company_name","company_domain","neverbounce_result","verified_at"].join(",") + "\n";
  const rows = (data ?? []).map(r => [
    csv(r.full_name),
    csv(r.email),
    csv(r.title),
    csv(r.company_name),
    csv(r.company_domain),
    csv(r.neverbounce_result),
    csv(r.verified_at),
  ].join(",")).join("\n");

  return new Response(header + rows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads_export.csv"`
    }
  });
}

function csv(v: any) {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
