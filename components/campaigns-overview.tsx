"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ConfirmDialog from "./confirm-dialog";

interface CampaignStats {
  total_emails: number;
  pending: number;
  sent: number;
  failed: number;
  cancelled: number;
  response_received: number;
  response_count: number;
  positive_responses: number;
  negative_responses: number;
  response_rate: string;
  stage_1_count: number;
  stage_2_count: number;
  stage_3_count: number;
  enabled_stages: number;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
  stats?: CampaignStats;
}

interface Props {
  campaigns: Campaign[];
}

export default function CampaignsOverview({ campaigns: initialCampaigns }: Props) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [loadingStats, setLoadingStats] = useState<Record<string, boolean>>({});
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    confirmClass?: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Load stats for all campaigns
  useEffect(() => {
    const loadAllStats = async () => {
      for (const campaign of campaigns) {
        if (campaign.status === 'active' || campaign.status === 'paused') {
          await loadCampaignStats(campaign.id);
        }
      }
    };
    loadAllStats();
  }, []);

  const loadCampaignStats = async (campaignId: string) => {
    setLoadingStats(prev => ({ ...prev, [campaignId]: true }));
    try {
      const response = await fetch(`/api/email-automation/stats?campaignId=${campaignId}`);
      const data = await response.json();
      
      if (data.stats) {
        setCampaigns(prev => prev.map(c => 
          c.id === campaignId ? { ...c, stats: data.stats } : c
        ));
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoadingStats(prev => ({ ...prev, [campaignId]: false }));
    }
  };

  const toggleCampaignStatus = (campaign: Campaign) => {
    const newStatus = campaign.status === 'active' ? 'paused' : 'active';
    const action = newStatus === 'active' ? 'Resume' : 'Pause';
    
    setConfirmDialog({
      isOpen: true,
      title: `${action} Campaign`,
      message: `Are you sure you want to ${action.toLowerCase()} "${campaign.name}"?`,
      confirmText: action,
      confirmClass: newStatus === 'active' ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        setTogglingStatus(campaign.id);
        
        try {
          const response = await fetch('/api/campaigns/toggle-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              campaignId: campaign.id,
              status: newStatus
            })
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update campaign status');
          }

          setCampaigns(prev => prev.map(c => 
            c.id === campaign.id ? { ...c, status: newStatus } : c
          ));
          
          // Reload stats after status change
          await loadCampaignStats(campaign.id);
        } catch (error: any) {
          console.error('Toggle error:', error);
          alert(`Failed to ${action.toLowerCase()} campaign: ${error.message}`);
        } finally {
          setTogglingStatus(null);
        }
      }
    });
  };

  const deleteCampaign = (campaign: Campaign) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Campaign',
      message: `Are you sure you want to delete "${campaign.name}"? This will delete all associated emails and cannot be undone.`,
      confirmText: 'Delete',
      confirmClass: 'bg-red-600 hover:bg-red-700',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        setDeletingId(campaign.id);
        
        try {
          const response = await fetch(`/api/campaigns?id=${campaign.id}`, {
            method: 'DELETE'
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete campaign');
          }

          setCampaigns(prev => prev.filter(c => c.id !== campaign.id));
        } catch (error: any) {
          console.error('Delete error:', error);
          alert(`Failed to delete campaign: ${error.message}`);
        } finally {
          setDeletingId(null);
        }
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'draft': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '🟢';
      case 'paused': return '⏸️';
      case 'draft': return '📝';
      case 'completed': return '✅';
      default: return '⚪';
    }
  };

  if (campaigns.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-gray-200">
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
    );
  }

  return (
    <>
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText || 'Confirm'}
        cancelText="Cancel"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((campaign) => (
          <div
            key={campaign.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {campaign.name || 'Unnamed Campaign'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(campaign.status)}`}>
                      {getStatusIcon(campaign.status)} {campaign.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => deleteCampaign(campaign)}
                  disabled={deletingId === campaign.id}
                  className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                  title="Delete campaign"
                >
                  {deletingId === campaign.id ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
              
              {/* Campaign Summary */}
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(campaign.created_at).toLocaleDateString()}
                  </span>
                </div>
                {campaign.updated_at && campaign.updated_at !== campaign.created_at && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(campaign.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {campaign.stats && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Emails:</span>
                    <span className="font-medium text-gray-900">
                      {campaign.stats.total_emails}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            {(campaign.status === 'active' || campaign.status === 'paused') && (
              <div className="p-6 bg-gray-50">
                {loadingStats[campaign.id] ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-600 mt-2">Loading stats...</p>
                  </div>
                ) : campaign.stats ? (
                  <div className="space-y-4">
                    {/* Email Stages */}
                    <div>
                      <div className="text-xs font-semibold text-gray-700 mb-2">Email Stages</div>
                      <div className="grid grid-cols-3 gap-2">
                        {campaign.stats.enabled_stages >= 1 && (
                          <div className="bg-white rounded-lg p-2 border border-gray-200">
                            <div className="text-lg font-bold text-blue-600">{campaign.stats.stage_1_count}</div>
                            <div className="text-xs text-gray-600">Stage 1</div>
                          </div>
                        )}
                        {campaign.stats.enabled_stages >= 2 && (
                          <div className="bg-white rounded-lg p-2 border border-gray-200">
                            <div className="text-lg font-bold text-purple-600">{campaign.stats.stage_2_count}</div>
                            <div className="text-xs text-gray-600">Stage 2</div>
                          </div>
                        )}
                        {campaign.stats.enabled_stages >= 3 && (
                          <div className="bg-white rounded-lg p-2 border border-gray-200">
                            <div className="text-lg font-bold text-pink-600">{campaign.stats.stage_3_count}</div>
                            <div className="text-xs text-gray-600">Stage 3</div>
                          </div>
                        )}
                      </div>
                      {campaign.stats.enabled_stages === 1 && (
                        <p className="text-xs text-gray-500 mt-1">Only Stage 1 enabled</p>
                      )}
                      {campaign.stats.enabled_stages === 2 && (
                        <p className="text-xs text-gray-500 mt-1">2 stages enabled</p>
                      )}
                    </div>

                    {/* Email Status */}
                    <div>
                      <div className="text-xs font-semibold text-gray-700 mb-2">Email Status</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white rounded-lg p-2 border border-gray-200">
                          <div className="text-lg font-bold text-green-600">{campaign.stats.sent}</div>
                          <div className="text-xs text-gray-600">Sent</div>
                        </div>
                        <div className="bg-white rounded-lg p-2 border border-gray-200">
                          <div className="text-lg font-bold text-yellow-600">{campaign.stats.pending}</div>
                          <div className="text-xs text-gray-600">Pending</div>
                        </div>
                      </div>
                    </div>

                    {/* Responses */}
                    <div>
                      <div className="text-xs font-semibold text-gray-700 mb-2">Responses</div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white rounded-lg p-2 border border-gray-200">
                          <div className="text-lg font-bold text-blue-600">{campaign.stats.response_count}</div>
                          <div className="text-xs text-gray-600">Total</div>
                        </div>
                        <div className="bg-white rounded-lg p-2 border border-green-200 bg-green-50">
                          <div className="text-lg font-bold text-green-600">{campaign.stats.positive_responses}</div>
                          <div className="text-xs text-gray-600">Positive</div>
                        </div>
                        <div className="bg-white rounded-lg p-2 border border-red-200 bg-red-50">
                          <div className="text-lg font-bold text-red-600">{campaign.stats.negative_responses}</div>
                          <div className="text-xs text-gray-600">Negative</div>
                        </div>
                      </div>
                      <div className="mt-2 text-center">
                        <span className="text-sm font-semibold text-gray-900">{campaign.stats.response_rate}</span>
                        <span className="text-xs text-gray-600 ml-1">response rate</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-sm text-gray-600">
                    No stats available
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="p-4 bg-white border-t border-gray-100 flex items-center justify-between gap-2">
              {(campaign.status === 'active' || campaign.status === 'paused') && (
                <button
                  onClick={() => toggleCampaignStatus(campaign)}
                  disabled={togglingStatus === campaign.id}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    campaign.status === 'active'
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  } disabled:opacity-50`}
                >
                  {togglingStatus === campaign.id ? '...' : campaign.status === 'active' ? '⏸️ Pause' : '▶️ Resume'}
                </button>
              )}
              
              <Link
                href={`/campaigns/${campaign.id}/dashboard`}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-center transition-colors"
              >
                View Details →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
