import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";

export default async function CampaignsPage() {
  const user = await requireAuth();
  const supabase = supabaseAdmin();

  const { data: campaigns } = await supabase
    .from("cold_outreach_email_campaigns")
    .select(`
      *,
      cold_outreach_contacts (count)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const activeCount = campaigns?.filter((c) => c.status === "active").length || 0;
  const draftCount = campaigns?.filter((c) => c.status === "draft").length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Campaigns</h1>
          <p className="mt-1 text-sm text-slate-600">
            Create and manage your email campaigns
          </p>
        </div>
        <Link
          href="/campaigns/new"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 inline-flex items-center gap-2"
        >
          <span className="text-xl">+</span>
          Create New Campaign
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-2xl font-bold text-slate-900">{campaigns?.length || 0}</div>
          <div className="text-sm text-slate-600">Total Campaigns</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-2xl font-bold text-green-600">{activeCount}</div>
          <div className="text-sm text-slate-600">Active</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-2xl font-bold text-blue-600">{draftCount}</div>
          <div className="text-sm text-slate-600">Draft</div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {campaigns && campaigns.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Campaign Name</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Status</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Contacts</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Created</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {campaign.name || 'Unnamed Campaign'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      campaign.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : campaign.status === 'draft'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {(campaign as any).cold_outreach_contacts?.[0]?.count || 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(campaign.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {campaign.status === 'active' ? (
                      <Link
                        href={`/campaigns/${campaign.id}/dashboard`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View Dashboard →
                      </Link>
                    ) : campaign.status === 'draft' ? (
                      <Link
                        href={`/campaigns/${campaign.id}/select-leads`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Continue Setup →
                      </Link>
                    ) : (
                      <Link
                        href={`/campaigns/${campaign.id}/dashboard`}
                        className="text-gray-600 hover:text-gray-700 font-medium"
                      >
                        View →
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">📧</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No campaigns yet</h3>
            <p className="text-gray-600 mb-6">Create your first email campaign to get started</p>
            <Link
              href="/campaigns/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              <span className="text-xl">+</span>
              Create Your First Campaign
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
