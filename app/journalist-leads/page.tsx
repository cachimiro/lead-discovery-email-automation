import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import JournalistLeadsPageClient from "@/components/journalist-leads-page-client";

// Force dynamic rendering - don't cache this page
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function JournalistLeadsPage() {
  const user = await requireAuth();
  const supabase = supabaseAdmin();

  const { data: leads } = await supabase
    .from("cold_outreach_journalist_leads")
    .select("*")
    .eq("user_id", user.id)
    .order("deadline", { ascending: true });

  return <JournalistLeadsPageClient initialLeads={leads || []} userId={user.id} />;
}
