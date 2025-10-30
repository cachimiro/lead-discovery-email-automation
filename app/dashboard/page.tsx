import { requireAuth } from "@/lib/auth";
import Link from "next/link";
import SignOutButton from "@/components/sign-out-button";
import { supabaseAdmin } from "@/lib/supabase";

export default async function DashboardPage() {
  const user = await requireAuth();
  const firstName = user.name?.split(' ')[0] || user.email?.split('@')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Fetch real data from database
  const supabase = supabaseAdmin();
  
  const [journalistLeadsResult, contactsResult, campaignsResult] = await Promise.all([
    supabase.from('cold_outreach_journalist_leads').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_active', true),
    supabase.from('cold_outreach_contacts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('cold_outreach_email_campaigns').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
  ]);

  const stats = {
    journalistLeads: journalistLeadsResult.count || 0,
    contacts: contactsResult.count || 0,
    campaigns: campaignsResult.count || 0
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header with Gradient */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl"></div>
        
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">{greeting}, {firstName}</h1>
            <p className="text-blue-100 text-lg">
              Ready to discover and connect with your next leads
            </p>
          </div>
          <SignOutButton />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-8 md:grid-cols-3">
        <Link href="/journalist-leads" className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.journalistLeads}</div>
          <div className="text-sm text-gray-600">Journalist Leads</div>
          <div className="text-xs text-blue-600 mt-2">Click to view →</div>
        </Link>

        <Link href="/contacts" className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.contacts}</div>
          <div className="text-sm text-gray-600">Contacts</div>
          <div className="text-xs text-blue-600 mt-2">Click to view →</div>
        </Link>

        <Link href="/campaigns" className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.campaigns}</div>
          <div className="text-sm text-gray-600">Campaigns</div>
          <div className="text-xs text-blue-600 mt-2">Click to view →</div>
        </Link>
      </div>

      {/* Main Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid gap-8 md:grid-cols-3">
          <Link
            href="/campaigns/new"
            className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all text-white"
          >
            <h3 className="text-lg font-semibold mb-2">
              🚀 Create Campaign
            </h3>
            <p className="text-blue-100 text-sm">
              Create a new email outreach campaign with auto-matching
            </p>
          </Link>

          <Link
            href="/journalist-leads"
            className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ✍️ Journalist Leads
            </h3>
            <p className="text-gray-600 text-sm">
              Manage journalist opportunities and deadlines
            </p>
          </Link>

          <Link
            href="/contacts"
            className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              👥 Contact Database
            </h3>
            <p className="text-gray-600 text-sm">
              Manage and organize your contact list
            </p>
          </Link>
        </div>
      </div>

      {/* Discovery Tools */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Lead Discovery</h2>
        <Link
          href="/discover"
          className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm hover:shadow-md hover:border-blue-200 transition-all block"
        >
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Unified Lead Finder</h3>
            <p className="text-gray-600">All-in-one email discovery with AI-powered search</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Find Person', desc: 'By name' },
              { label: 'Decision Maker', desc: 'By role' },
              { label: 'Company Emails', desc: 'Bulk find' },
              { label: 'LinkedIn', desc: 'From URL' },
            ].map((tool, i) => (
              <div key={i} className="text-center p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="text-sm font-medium text-gray-900 mb-1">{tool.label}</div>
                <div className="text-xs text-gray-600">{tool.desc}</div>
              </div>
            ))}
          </div>
        </Link>
      </div>
    </div>
  );
}
