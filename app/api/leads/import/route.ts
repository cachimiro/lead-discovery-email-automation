// app/api/leads/import/route.ts
import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

type LeadIn = {
  email: string;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  title?: string | null;
  companyName?: string | null;
  seniority?: string | null;
  amf_email_status?: "valid" | "risky" | "not_found" | "blacklisted" | string | null;
  verified_status?: "valid" | "invalid" | "disposable" | "catchall" | "unknown" | string | null;
  confidence?: number | null;
  source?: "person" | "decision_maker" | "company" | "linkedin";
  decision_categories?: string[] | null;
  email_type?: "any" | "personal" | "generic" | null;
  linkedin_url?: string | null;
  stripe_session_id?: string | null;
  meta?: any;
};

function inferDomainFromEmail(email?: string) {
  if (!email) return undefined;
  const at = email.indexOf("@");
  if (at < 0) return undefined;
  const d = email.slice(at + 1).trim().toLowerCase();
  // very light guard
  if (!d || !d.includes(".")) return undefined;
  return d;
}

export async function POST(req: NextRequest) {
  try {
    const { domain, leads } = await req.json();

    if (!Array.isArray(leads) || leads.length === 0) {
      return Response.json({ error: "leads[] required" }, { status: 400 });
    }

    const domainParam = (domain as string | undefined)?.trim().toLowerCase() || "";

    // Deduplicate by email (case-insensitive) before writing
    const seen = new Set<string>();
    const today = new Date();
    const isoNow = today.toISOString();
    const yyyyMmDd = isoNow.slice(0, 10);

    const prepared = [];
    let skippedNoDomain = 0;

    for (const l of leads as LeadIn[]) {
      const email = (l.email || "").trim().toLowerCase();
      if (!email) continue;

      const key = email;
      if (seen.has(key)) continue;
      seen.add(key);

      const inferred = inferDomainFromEmail(email);
      const finalDomain = domainParam || inferred || "";

      // If we still can’t determine a domain, skip (schema requires NOT NULL)
      if (!finalDomain) {
        skippedNoDomain++;
        continue;
      }

      prepared.push({
        // provenance
        source: l.source ?? "person",
        decision_categories: l.decision_categories ?? null,
        linkedin_url: l.linkedin_url ?? null,
        email_type: l.email_type ?? null,

        // company + person
        company_domain: finalDomain,
        company_name: l.companyName ?? null,
        full_name: l.fullName ?? null,
        first_name: l.firstName ?? null,
        last_name: l.lastName ?? null,
        title: l.title ?? null,
        seniority: l.seniority ?? null,

        // email + statuses
        email,
        amf_email_status: l.amf_email_status ?? null,
        nb_status: l.verified_status ?? null,
        confidence: typeof l.confidence === "number" ? l.confidence : null,

        // timestamps
        discovered_at: isoNow,
        verified_at: l.verified_status ? isoNow : null,
        created_at: isoNow,
        date_created: yyyyMmDd, // DATE

        // commerce + misc
        stripe_session_id: l.stripe_session_id ?? "dev-import",
        meta: l.meta ?? null,
      });
    }

    if (prepared.length === 0) {
      return Response.json(
        { inserted: 0, skipped_no_domain: skippedNoDomain, reason: "No rows with a resolvable domain" },
        { status: 200 }
      );
    }

    const sb = supabaseAdmin();
    const { error } = await sb
      .from("cold_outreach_discovered_leads")
      .upsert(prepared, { onConflict: "email,company_domain" });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      inserted: prepared.length,
      skipped_no_domain: skippedNoDomain,
    });
  } catch (err: any) {
    console.error("[leads/import]", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
