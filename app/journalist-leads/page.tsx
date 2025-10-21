import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import JournalistLeadsList from "@/components/journalist-leads-list";
import AddJournalistLeadForm from "@/components/add-journalist-lead-form";

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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Journalist Leads</h1>
          <p className="text-gray-600">
            Manage journalist opportunities and match them with your contacts
          </p>
        </div>
        <Link
          href="/email-matcher"
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          Match & Send Emails
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
