import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import CampaignsList from "@/components/campaigns-list";
import DeleteAllCampaignsButton from "@/components/delete-all-campaigns-button";

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
        <div className="flex items-center gap-3">
          {campaigns && campaigns.length > 0 && <DeleteAllCampaignsButton />}
          <Link
            href="/campaigns/new"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 inline-flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            Create New Campaign
          </Link>
        </div>
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
        <CampaignsList campaigns={campaigns || []} />
      </div>
    </div>
  );
}
