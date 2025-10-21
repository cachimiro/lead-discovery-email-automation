import type { NextRequest } from "next/server";
export const runtime = "nodejs";

import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" as Stripe.LatestApiVersion,});
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

function inferDomainFromEmail(email?: string | null) {
  if (!email) return undefined;
  const at = email.indexOf("@");
  if (at < 0) return undefined;
  const d = email.slice(at + 1).trim().toLowerCase();
  return d && d.includes(".") ? d : undefined;
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing signature", { status: 400 });

  const body = Buffer.from(await req.arrayBuffer());  

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    return new Response(`Bad signature: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const batchId = session.metadata?.batch_id;
    if (!batchId) return new Response("ok", { status: 200 });

    const sb = supabaseAdmin();

    // Load pending batch
    const { data: pending, error } = await sb
      .from("cold_outreach_pending_leads")
      .select("*")
      .eq("id", batchId)
      .single();

    if (error || !pending) return new Response("ok", { status: 200 });

    const nowIso = new Date().toISOString();
    const today = nowIso.slice(0, 10);

    // Move each lead into cold_outreach_discovered_leads
    const leads: any[] = pending.leads || [];
    const rows = leads.map((l) => {
      const domain = l.company_domain || inferDomainFromEmail(l.email) || null;

      return {
        source: l.source ?? "company",
        decision_categories: l.decision_categories ?? null,
        linkedin_url: l.linkedin_url ?? null,
        email_type: l.email_type ?? null,

        company_domain: domain,
        company_name: l.companyName ?? null,
        full_name: l.fullName ?? null,
        first_name: l.firstName ?? null,
        last_name: l.lastName ?? null,
        title: l.title ?? null,
        seniority: l.seniority ?? null,

        email: (l.email || "").toLowerCase(),
        amf_email_status: l.amf_email_status ?? null,
        nb_status: l.verified_status ?? "valid",

        discovered_at: nowIso,
        verified_at: nowIso,
        created_at: nowIso,
        date_created: today,

        stripe_session_id: pending.stripe_session_id ?? session.id,
        meta: l.meta ?? null,
      };
    }).filter(r => !!r.email && !!r.company_domain); // keep rows with domain + email

    if (rows.length) {
      await sb.from("cold_outreach_discovered_leads").upsert(rows, { onConflict: "email,company_domain" });
    }
  }

  return new Response("ok");
}
