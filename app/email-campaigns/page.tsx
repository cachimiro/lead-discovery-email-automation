import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import EmailCampaignsList from "@/components/email-campaigns-list";

export default async function EmailCampaignsPage() {
  const user = await requireAuth();
  const supabase = supabaseAdmin();

  const { data: campaigns } = await supabase
    .from("cold_outreach_email_campaigns")
    .select(`
      *,
      cold_outreach_journalist_leads (*),
      cold_outreach_contacts (*)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const draftCount = campaigns?.filter((c) => c.status === "draft").length || 0;
  const sentCount = campaigns?.filter((c) => c.status === "sent").length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Email Campaigns</h1>
          <p className="mt-1 text-sm text-slate-600">
            View and manage your email campaigns
          </p>
        </div>
        <a
          href="/campaigns/new"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 inline-flex items-center gap-2"
        >
          <span className="text-xl">+</span>
          Create New Campaign
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-2xl font-bold text-slate-900">{campaigns?.length || 0}</div>
          <div className="text-sm text-slate-600">Total Campaigns</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-2xl font-bold text-blue-600">{draftCount}</div>
          <div className="text-sm text-slate-600">Draft</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-2xl font-bold text-green-600">{sentCount}</div>
          <div className="text-sm text-slate-600">Sent</div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <EmailCampaignsList campaigns={campaigns || []} />
      </div>
    </div>
  );
}
