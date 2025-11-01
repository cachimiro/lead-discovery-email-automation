import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import CampaignsOverview from "@/components/campaigns-overview";
import DeleteAllCampaignsButton from "@/components/delete-all-campaigns-button";
import CampaignsStats from "@/components/campaigns-stats";

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

      <CampaignsStats 
        totalCount={campaigns?.length || 0}
        activeCount={activeCount}
        pausedCount={pausedCount}
        draftCount={draftCount}
      />

      <CampaignsOverview campaigns={campaigns || []} />
    </div>
  );
}
