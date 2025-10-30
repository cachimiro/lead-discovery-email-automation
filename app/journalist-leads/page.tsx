import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import JournalistLeadsList from "@/components/journalist-leads-list";
import AddJournalistLeadForm from "@/components/add-journalist-lead-form";

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

  // Count active leads (not expired)
  const activeLeads = leads?.filter(
    (lead) => new Date(lead.deadline) >= new Date() && lead.is_active
  );

  // Count leads without industry
  const leadsWithoutIndustry = leads?.filter(
    (lead) => !lead.industry || lead.industry.trim() === ''
  ) || [];

  return (
    <div className="space-y-8">
      {leadsWithoutIndustry.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                ⚠️ {leadsWithoutIndustry.length} lead{leadsWithoutIndustry.length !== 1 ? 's' : ''} missing industry
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                These leads cannot be used in campaigns until an industry is assigned. Click "Add Industry" to fix.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Journalist Leads</h1>
          <p className="text-gray-600">
            Manage journalist opportunities and match them with your contacts
          </p>
        </div>
        <Link
          href="/campaigns/new"
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          Create Campaign
        </Link>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {activeLeads?.length || 0}
          </div>
          <div className="text-gray-600 font-medium">Active Opportunities</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {leads?.length || 0}
          </div>
          <div className="text-gray-600 font-medium">Total Leads</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {leads?.filter((l) => new Date(l.deadline) < new Date()).length || 0}
          </div>
          <div className="text-gray-600 font-medium">Expired</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
        <h2 className="mb-6 text-xl font-semibold text-gray-900">
          Add New Journalist Lead
        </h2>
        <AddJournalistLeadForm userId={user.id} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
        <div className="border-b border-gray-100 pb-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Your Leads</h2>
        </div>
        <JournalistLeadsList leads={leads || []} />
      </div>
    </div>
  );
}
