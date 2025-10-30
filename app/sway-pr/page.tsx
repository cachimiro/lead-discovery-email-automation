import { requireAuth } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import Link from "next/link";

export default async function SwayPRPage() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();

  const { data: leads, error } = await supabase
    .from('cold_outreach_journalist_leads')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('deadline', { ascending: true});

  if (error) {
    console.error('Error fetching journalist leads:', error);
  }

  const activeLeads = leads || [];
  const upcomingDeadlines = activeLeads.filter(lead => {
    const deadline = new Date(lead.deadline);
    const today = new Date();
    const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 7 && daysUntil >= 0;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sway PR</h1>
        <p className="text-gray-600">Active journalist opportunities and media leads</p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="text-3xl font-bold text-gray-900 mb-1">{activeLeads.length}</div>
          <div className="text-sm text-gray-600">Active Leads</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="text-3xl font-bold text-gray-900 mb-1">{upcomingDeadlines.length}</div>
          <div className="text-sm text-gray-600">Upcoming Deadlines</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {activeLeads.filter(l => new Date(l.deadline) < new Date()).length}
          </div>
          <div className="text-sm text-gray-600">Past Deadline</div>
        </div>
      </div>

      {/* Active Leads List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Active Opportunities</h2>
            <Link
              href="/journalist-leads"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Manage Leads →
            </Link>
          </div>
        </div>

        {activeLeads.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600 mb-4">No active journalist leads yet</p>
            <Link
              href="/journalist-leads"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Your First Lead
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {activeLeads.map((lead) => {
              const deadline = new Date(lead.deadline);
              const today = new Date();
              const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              const isUrgent = daysUntil <= 3 && daysUntil >= 0;
              const isPast = daysUntil < 0;

              return (
                <div key={lead.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {lead.subject}
                        </h3>
                        {isUrgent && (
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded">
                            Urgent
                          </span>
                        )}
                        {isPast && (
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                            Past Due
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Journalist:</span>
                          <div className="font-medium text-gray-900">{lead.journalist_name}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Publication:</span>
                          <div className="font-medium text-gray-900">{lead.publication}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Industry:</span>
                          <div className="font-medium text-gray-900">{lead.industry}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Deadline:</span>
                          <div className={`font-medium ${isPast ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-gray-900'}`}>
                            {deadline.toLocaleDateString()}
                            {daysUntil >= 0 && ` (${daysUntil}d)`}
                          </div>
                        </div>
                      </div>

                      {lead.notes && (
                        <p className="mt-3 text-sm text-gray-600 line-clamp-2">{lead.notes}</p>
                      )}
                    </div>

                    <Link
                      href="/campaigns/new"
                      className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors whitespace-nowrap"
                    >
                      Create Campaign
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
