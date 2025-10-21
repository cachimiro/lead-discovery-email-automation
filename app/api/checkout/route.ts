// app/api/checkout/route.ts
import type { NextRequest } from "next/server";
export const runtime = "nodejs";

import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";

const TEST_MODE = process.env.TEST_MODE === "true";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20" as Stripe.LatestApiVersion,
});
const UNIT_PENCE = parseInt(process.env.PRICE_PER_LEAD_PENCE || "60", 10);

type LeadIn = {
  email: string;
  company_domain?: string | null;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  title?: string | null;
  companyName?: string | null;
  seniority?: string | null;
  amf_email_status?: string | null;
  verified_status?: string | null; // should be "valid"
  source?: "person" | "decision_maker" | "company" | "linkedin";
  decision_categories?: string[] | null;
  email_type?: "any" | "personal" | "generic" | null;
  linkedin_url?: string | null;
  meta?: any;
};

function inferDomainFromEmail(email?: string | null) {
  if (!email) return undefined;
  const at = email.indexOf("@");
  if (at < 0) return undefined;
  const d = email.slice(at + 1).trim().toLowerCase();
  return d && d.includes(".") ? d : undefined;
}

export async function POST(req: NextRequest) {
  const authSession = await getServerSession(authOptions);

  if (!authSession || !authSession.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { leads } = (await req.json()) as { leads: LeadIn[] };

  if (!Array.isArray(leads) || leads.length === 0) {
    return Response.json({ error: "Non-empty leads[] required" }, { status: 400 });
  }

  const quantity = leads.length;
  const sb = supabaseAdmin();

  // 1) Stage as pending
  const { data: pending, error } = await sb
    .from("cold_outreach_pending_leads")
    .insert({ leads })
    .select()
    .single();

  if (error || !pending) {
    return Response.json({ error: error?.message || "Pending insert failed" }, { status: 500 });
  }

  // ---------- TEST MODE BYPASS ----------
  if (TEST_MODE) {
    const fakeSessionId = `test_${pending.id}`;
    const nowIso = new Date().toISOString();
    const today = nowIso.slice(0, 10);

    // set a fake stripe_session_id on the pending batch
    await sb
      .from("cold_outreach_pending_leads")
      .update({ stripe_session_id: fakeSessionId })
      .eq("id", pending.id);

    // directly upsert into cold_outreach_discovered_leads (simulate webhook fulfillment)
    const rows = (leads as LeadIn[])
      .map((l) => {
        const email = (l.email || "").toLowerCase();
        const domain = l.company_domain || inferDomainFromEmail(email) || null;
        if (!email || !domain) return null;

        return {
          user_id: authSession.user.id,
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

          email,
          amf_email_status: l.amf_email_status ?? null,
          nb_status: l.verified_status ?? "valid",

          discovered_at: nowIso,
          verified_at: nowIso,
          created_at: nowIso,
          date_created: today,

          stripe_session_id: fakeSessionId,
          meta: l.meta ?? null,
        };
      })
      .filter(Boolean) as any[];

    if (rows.length) {
      await sb.from("cold_outreach_discovered_leads").upsert(rows, { onConflict: "email,company_domain" });
    }

    // Pretend “checkout URL” is your success page; the client will redirect there
    return Response.json({
      checkoutUrl: `${process.env.PUBLIC_BASE_URL}/success?batch=${pending.id}`,
      batchId: pending.id,
      note: "TEST_MODE enabled: skipped Stripe and inserted leads directly.",
    });
  }
  // ---------- /TEST MODE BYPASS ----------

  // 2) Create real Stripe Checkout session
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${process.env.PUBLIC_BASE_URL}/success?batch=${pending.id}`,
    cancel_url: `${process.env.PUBLIC_BASE_URL}/cancel?batch=${pending.id}`,
    line_items: [
      {
        price_data: {
          currency: "gbp",
          product_data: { name: "Verified email leads" },
          unit_amount: UNIT_PENCE, // 60p per lead
        },
        quantity,
      },
    ],
    metadata: { batch_id: pending.id, quantity: String(quantity) },
  });

  // 3) Store session id back on pending
  await sb.from("cold_outreach_pending_leads").update({ stripe_session_id: session.id }).eq("id", pending.id);

  return Response.json({ checkoutUrl: session.url, batchId: pending.id });
}
