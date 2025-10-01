import type { NextRequest } from "next/server";
export const runtime = "nodejs";

import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" as Stripe.LatestApiVersion,});
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
  verified_status?: string | null;    // should be "valid"
  source?: "person" | "decision_maker" | "company" | "linkedin";
  decision_categories?: string[] | null;
  email_type?: "any" | "personal" | "generic" | null;
  linkedin_url?: string | null;
  meta?: any;
};

export async function POST(req: NextRequest) {
  const { leads } = (await req.json()) as { leads: LeadIn[] };

  if (!Array.isArray(leads) || leads.length === 0) {
    return Response.json({ error: "Non-empty leads[] required" }, { status: 400 });
  }

  const quantity = leads.length;

  // 1) Stage as pending
  const sb = supabaseAdmin();
  const { data: pending, error } = await sb
    .from("LDApending")
    .insert({ leads })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // 2) Create checkout session
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
  await sb.from("LDApending").update({ stripe_session_id: session.id }).eq("id", pending.id);

  return Response.json({ checkoutUrl: session.url, batchId: pending.id });
}
