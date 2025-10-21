import { requireAuth } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import Link from "next/link";

export default async function WarmOutreachPage() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();

  const { data: contacts, error: contactsError } = await supabase
    .from('cold_outreach_contacts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const { data: campaigns, error: campaignsError } = await supabase
    .from('cold_outreach_email_campaigns')
    .select(`
      *,
      cold_outreach_journalist_leads (
        journalist_name,
        publication,
        subject
      ),
      cold_outreach_contacts (
        first_name,
        last_name,
        email,
        company
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (contactsError) {
    console.error('Error fetching contacts:', contactsError);
  }
  if (campaignsError) {
    console.error('Error fetching campaigns:', campaignsError);
  }

  const allContacts = contacts || [];
  const recentCampaigns = campaigns || [];
  const sentCampaigns = recentCampaigns.filter(c => c.status === 'sent');
  const draftCampaigns = recentCampaigns.filter(c => c.status === 'draft');

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Warm Outreach</h1>
        <p className="text-gray-600">Manage your contacts and email campaigns</p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="text-3xl font-bold text-gray-900 mb-1">{allContacts.length}</div>
          <div className="text-sm text-gray-600">Total Contacts</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="text-3xl font-bold text-gray-900 mb-1">{sentCampaigns.length}</div>
          <div className="text-sm text-gray-600">Emails Sent</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="text-3xl font-bold text-gray-900 mb-1">{draftCampaigns.length}</div>
          <div className="text-sm text-gray-600">Draft Campaigns</div>
        </div>
      </div>

      {/* Recent Campaigns */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Recent Campaigns</h2>
            <Link
              href="/email-campaigns"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All →
            </Link>
          </div>
        </div>

        {recentCampaigns.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600 mb-4">No email campaigns yet</p>
            <Link
              href="/email-matcher"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Campaign
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentCampaigns.map((campaign) => {
              const contact = campaign.contacts;
              const lead = campaign.journalist_leads;
              const statusColors = {
                sent: 'bg-green-100 text-green-700',
                draft: 'bg-gray-100 text-gray-700',
                failed: 'bg-red-100 text-red-700'
              };

              return (
                <div key={campaign.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {campaign.subject}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[campaign.status as keyof typeof statusColors]}`}>
                          {campaign.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">To:</span>
                          <div className="font-medium text-gray-900">
                            {contact?.first_name} {contact?.last_name}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Company:</span>
                          <div className="font-medium text-gray-900">{contact?.company || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Opportunity:</span>
                          <div className="font-medium text-gray-900 truncate">{lead?.subject || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Date:</span>
                          <div className="font-medium text-gray-900">
                            {campaign.sent_at 
                              ? new Date(campaign.sent_at).toLocaleDateString()
                              : new Date(campaign.created_at).toLocaleDateString()
                            }
                          </div>
                        </div>
                      </div>

                      {campaign.error_message && (
                        <p className="mt-3 text-sm text-red-600">{campaign.error_message}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Contacts Overview */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Your Contacts</h2>
            <Link
              href="/contacts"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Manage Contacts →
            </Link>
          </div>
        </div>

        {allContacts.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600 mb-4">No contacts yet</p>
            <Link
              href="/contacts"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Your First Contact
            </Link>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {allContacts.slice(0, 6).map((contact) => (
                <div key={contact.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-200 hover:shadow-sm transition-all">
                  <div className="font-semibold text-gray-900 mb-1">
                    {contact.first_name} {contact.last_name}
                  </div>
                  <div className="text-sm text-gray-600 mb-1">{contact.email}</div>
                  {contact.company && (
                    <div className="text-sm text-gray-600">{contact.company}</div>
                  )}
                  {contact.title && (
                    <div className="text-xs text-gray-500 mt-1">{contact.title}</div>
                  )}
                </div>
              ))}
            </div>
            {allContacts.length > 6 && (
              <div className="mt-4 text-center">
                <Link
                  href="/contacts"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all {allContacts.length} contacts →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
