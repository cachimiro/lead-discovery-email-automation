import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import DiscoveredLeadsList from "@/components/discovered-leads-list";

export default async function DiscoveredLeadsPage() {
  const user = await requireAuth();
  const supabase = supabaseAdmin();

  // Fetch both manual and AI discovered leads
  const { data: manualLeads } = await supabase
    .from("cold_outreach_discovered_leads")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: aiLeads } = await supabase
    .from("cold_outreach_ai_discovered_leads")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Combine and normalize both lead types
  const allLeads = [
    ...(manualLeads || []).map(lead => ({
      ...lead,
      source: 'manual',
      email: lead.email,
      isValid: lead.nb_status === "valid"
    })),
    ...(aiLeads || []).map(lead => ({
      ...lead,
      source: 'ai',
      email: lead.contact_email,
      isValid: lead.email_status === "valid"
    }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const validLeads = allLeads.filter(lead => lead.isValid);
  const totalLeads = allLeads.length;
  
  console.log(`Discovered leads page: ${manualLeads?.length || 0} manual, ${aiLeads?.length || 0} AI, ${totalLeads} total`);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Discovered Leads</h1>
          <p className="text-gray-600">
            All verified email leads from your discovery searches
          </p>
        </div>
        <Link
          href="/discover"
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          Discover More Leads
        </Link>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {validLeads.length}
          </div>
          <div className="text-gray-600 font-medium">Valid Leads</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {totalLeads}
          </div>
          <div className="text-gray-600 font-medium">Total Leads</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {allLeads.filter((l) => l.source === "ai").length}
          </div>
          <div className="text-gray-600 font-medium">AI Discovered</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
        <div className="border-b border-gray-100 pb-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Your Discovered Leads</h2>
        </div>

        {allLeads.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No leads discovered yet</p>
            <Link
              href="/discover"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              Start Discovering Leads
            </Link>
          </div>
        ) : (
          <DiscoveredLeadsList leads={allLeads} />
        )}
      </div>
    </div>
  );
}
