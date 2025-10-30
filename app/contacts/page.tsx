import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import UnifiedContactsList from "@/components/unified-contacts-list";

export default async function ContactsPage() {
  const user = await requireAuth();
  const supabase = supabaseAdmin();

  // Fetch contacts
  const { data: contacts } = await supabase
    .from("cold_outreach_contacts")
    .select("*")
    .order("created_at", { ascending: false });

  // Fetch discovered leads (both manual and AI)
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

  // Combine and normalize discovered leads
  const discoveredLeads = [
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">All Contacts</h1>
          <p className="text-gray-600">
            Manage your contacts and discovered leads in one place
          </p>
        </div>
        <Link
          href="/discover"
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          Discover More Leads
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {contacts?.length || 0}
          </div>
          <div className="text-gray-600 font-medium">Manual Contacts</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {discoveredLeads.length}
          </div>
          <div className="text-gray-600 font-medium">Discovered Leads</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {(contacts?.length || 0) + discoveredLeads.length}
          </div>
          <div className="text-gray-600 font-medium">Total</div>
        </div>
      </div>

      <UnifiedContactsList 
        contacts={contacts || []} 
        discoveredLeads={discoveredLeads}
        userId={user.id}
      />
    </div>
  );
}
