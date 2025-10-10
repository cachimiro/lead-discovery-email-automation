// app/api/leads/export/route.ts
import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

function csvEscape(val: any): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  // quote if it contains comma, quote, or newline
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCSV(rows: any[], headers: string[]): string {
  const lines: string[] = [];
  lines.push(headers.map(csvEscape).join(","));
  for (const row of rows) {
    const line = headers.map((h) => csvEscape(row[h]));
    lines.push(line.join(","));
  }
  return lines.join("\n");
}

/**
 * Modes:
 *  1) Batch export (preferred, paid-only):
 *     GET /api/leads/export?batch=<LDApending.id>
 *     - Looks up LDApending by id -> gets stripe_session_id
 *     - Exports rows from LDAleads with that stripe_session_id
 *
 *  2) Filter export (fallback):
 *     GET /api/leads/export?domain=<domain>&query=<search>
 *     - Exports rows from LDAleads matching filters
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const batch = (url.searchParams.get("batch") || "").trim();
    const domain = (url.searchParams.get("domain") || "").trim().toLowerCase();
    const query = (url.searchParams.get("query") || "").trim();

    const sb = supabaseAdmin();

    // Common column set matching your LDAleads schema
    const selectCols = [
      "email",
      "full_name",
      "first_name",
      "last_name",
      "title",
      "company_name",
      "company_domain",
      "source",
      "decision_categories",
      "email_type",
      "linkedin_url",
      "amf_email_status",
      "nb_status",
      "created_at",
      "verified_at",
      "stripe_session_id",
    ].join(",");

    let leads: any[] = [];
    let filenameSuffix = "export";

    if (batch) {
      // --- Mode 1: export by paid batch ---
      const { data: pending, error: pendErr } = await sb
        .from("LDApending")
        .select("stripe_session_id")
        .eq("id", batch)
        .single();

      if (pendErr || !pending?.stripe_session_id) {
        return new Response(
          JSON.stringify({ error: "Batch not found or not paid yet" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await sb
        .from("LDAleads")
        .select(selectCols)
        .eq("stripe_session_id", pending.stripe_session_id)
        .order("created_at", { ascending: true });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      leads = data ?? [];
      filenameSuffix = `batch-${batch}`;
    } else {
      // --- Mode 2: filter export (domain/query) ---
      let q = sb
        .from("LDAleads")
        .select(selectCols)
        .order("created_at", { ascending: false });

      if (domain) q = q.eq("company_domain", domain);
      if (query) {
        // ilike on a few text fields
        const like = `%${query}%`;
        q = q.or(
          [
            `email.ilike.${like}`,
            `full_name.ilike.${like}`,
            `title.ilike.${like}`,
            `company_name.ilike.${like}`,
            `company_domain.ilike.${like}`,
          ].join(",")
        );
      }

      const { data, error } = await q;
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      leads = data ?? [];
      filenameSuffix = domain ? `domain-${domain}` : "filtered";
    }

    // Normalise arrays -> semicolon-joined for CSV
    const normalized = leads.map((r: any) => ({
      ...r,
      decision_categories: Array.isArray(r.decision_categories)
        ? r.decision_categories.join(";")
        : r.decision_categories ?? "",
    }));

    const headers = [
      "email",
      "full_name",
      "first_name",
      "last_name",
      "title",
      "company_name",
      "company_domain",
      "source",
      "decision_categories",
      "email_type",
      "linkedin_url",
      "amf_email_status",
      "nb_status",
      "created_at",
      "verified_at",
      "stripe_session_id",
    ];

    const csv = toCSV(normalized, headers);
    const filename = `leads-${filenameSuffix}-${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    console.error("[leads/export]", e);
    return new Response("Internal Server Error", { status: 500 });
  }
}
