"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  totalCount: number;
  activeCount: number;
  pausedCount: number;
  draftCount: number;
}

export default function CampaignsStats({ 
  totalCount: initialTotal,
  activeCount: initialActive,
  pausedCount: initialPaused,
  draftCount: initialDraft
}: Props) {
  const router = useRouter();
  const [stats, setStats] = useState({
    total: initialTotal,
    active: initialActive,
    paused: initialPaused,
    draft: initialDraft
  });

  // Update stats when props change (after server refresh)
  useEffect(() => {
    setStats({
      total: initialTotal,
      active: initialActive,
      paused: initialPaused,
      draft: initialDraft
    });
  }, [initialTotal, initialActive, initialPaused, initialDraft]);

  // Listen for custom events from campaigns-overview
  useEffect(() => {
    const handleStatsUpdate = (event: CustomEvent) => {
      setStats(event.detail);
    };

    window.addEventListener('campaigns-stats-update' as any, handleStatsUpdate);
    
    return () => {
      window.removeEventListener('campaigns-stats-update' as any, handleStatsUpdate);
    };
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
        <div className="text-sm text-slate-600">Total Campaigns</div>
      </div>
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="text-2xl font-bold text-green-600">{stats.active}</div>
        <div className="text-sm text-green-700">Active</div>
      </div>
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <div className="text-2xl font-bold text-yellow-600">{stats.paused}</div>
        <div className="text-sm text-yellow-700">Paused</div>
      </div>
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="text-2xl font-bold text-blue-600">{stats.draft}</div>
        <div className="text-sm text-blue-700">Draft</div>
      </div>
    </div>
  );
}
