import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import CampaignsOverview from "@/components/campaigns-overview";
import DeleteAllCampaignsButton from "@/components/delete-all-campaigns-button";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CampaignsPage() {
  const user = await requireAuth();
  const supabase = supabaseAdmin();

  const { data: campaigns } = await supabase
    .from("cold_outreach_campaigns")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const activeCount = campaigns?.filter((c) => c.status === "active").length || 0;
  const pausedCount = campaigns?.filter((c) => c.status === "paused").length || 0;
  const draftCount = campaigns?.filter((c) => c.status === "draft").length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">All Campaigns</h1>
          <p className="mt-1 text-sm text-slate-600">
            View and manage all your email campaigns at a glance
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

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-2xl font-bold text-slate-900">{campaigns?.length || 0}</div>
          <div className="text-sm text-slate-600">Total Campaigns</div>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="text-2xl font-bold text-green-600">{activeCount}</div>
          <div className="text-sm text-green-700">Active</div>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="text-2xl font-bold text-yellow-600">{pausedCount}</div>
          <div className="text-sm text-yellow-700">Paused</div>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="text-2xl font-bold text-blue-600">{draftCount}</div>
          <div className="text-sm text-blue-700">Draft</div>
        </div>
      </div>

      <CampaignsOverview campaigns={campaigns || []} />
    </div>
  );
}
