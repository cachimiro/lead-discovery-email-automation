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
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 10000);
    return () => clearInterval(interval);
  }, [router]);

  // Update campaigns when props change (after server refresh)
  // But preserve stats that were already loaded
  useEffect(() => {
    setCampaigns(prev => {
      // Merge new campaigns with existing stats
      return initialCampaigns.map(newCampaign => {
        const existing = prev.find(p => p.id === newCampaign.id);
        return existing?.stats 
          ? { ...newCampaign, stats: existing.stats }
          : newCampaign;
      });
    });
  }, [initialCampaigns]);

  // Fetch fresh campaign status from database and return it
  const refreshCampaignStatus = async (campaignId: string): Promise<string | null> => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/status`);
      const data = await response.json();
      
      if (data.success && data.campaign) {
        setCampaigns(prev => prev.map(c => 
          c.id === campaignId 
            ? { ...c, status: data.campaign.status, updated_at: data.campaign.updated_at }
            : c
        ));
        return data.campaign.status;
      }
      return null;
    } catch (error) {
      console.error('Error refreshing campaign status:', error);
      return null;
    }
  };

  // Load stats and refresh status for all campaigns
  useEffect(() => {
    const loadAllData = async () => {
      for (const campaign of campaigns) {
        // Refresh status from database and get the updated status
        const updatedStatus = await refreshCampaignStatus(campaign.id);
        
        // Load stats if the updated status is active or paused
        if (updatedStatus === 'active' || updatedStatus === 'paused') {
          await loadCampaignStats(campaign.id);
        }
      }
    };
    
    if (campaigns.length > 0) {
      loadAllData();
    }
  }, [campaigns.length]); // Only run when campaign count changes

  // Update stats display when campaigns change
  useEffect(() => {
    const total = campaigns.length;
    const active = campaigns.filter(c => c.status === 'active').length;
    const paused = campaigns.filter(c => c.status === 'paused').length;
    const draft = campaigns.filter(c => c.status === 'draft').length;

    const event = new CustomEvent('campaigns-stats-update', {
      detail: { total, active, paused, draft }
    });
    window.dispatchEvent(event);
  }, [campaigns]);

  const loadCampaignStats = async (campaignId: string) => {
    setLoadingStats(prev => ({ ...prev, [campaignId]: true }));
    try {
      console.log('[STATS] Loading stats for campaign:', campaignId);
      const response = await fetch(`/api/email-automation/stats?campaignId=${campaignId}`);
      const data = await response.json();
      
      console.log('[STATS] Response for', campaignId, ':', data);
      
      if (data.stats) {
        console.log('[STATS] Setting stats for campaign:', campaignId);
        setCampaigns(prev => prev.map(c => 
          c.id === campaignId ? { ...c, stats: data.stats } : c
        ));
      } else {
        console.warn('[STATS] No stats in response for campaign:', campaignId);
      }
    } catch (error) {
      console.error('[STATS] Error loading stats for', campaignId, ':', error);
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
          setSelectedCampaigns(prev => {
            const newSet = new Set(prev);
            newSet.delete(campaign.id);
            return newSet;
          });
          router.refresh();
        } catch (error: any) {
          console.error('Delete error:', error);
          alert(`Failed to delete campaign: ${error.message}`);
        } finally {
          setDeletingId(null);
        }
      }
    });
  };

  const toggleSelectCampaign = (campaignId: string) => {
    setSelectedCampaigns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(campaignId)) {
        newSet.delete(campaignId);
      } else {
        newSet.add(campaignId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedCampaigns.size === campaigns.length) {
      setSelectedCampaigns(new Set());
    } else {
      setSelectedCampaigns(new Set(campaigns.map(c => c.id)));
    }
  };

  const bulkDeleteCampaigns = () => {
    const count = selectedCampaigns.size;
    if (count === 0) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Delete Multiple Campaigns',
      message: `Are you sure you want to delete ${count} campaign${count > 1 ? 's' : ''}? This will delete all associated emails and cannot be undone.`,
      confirmText: 'Delete All',
      confirmClass: 'bg-red-600 hover:bg-red-700',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        setBulkDeleting(true);
        
        try {
          const deletePromises = Array.from(selectedCampaigns).map(id =>
            fetch(`/api/campaigns?id=${id}`, { method: 'DELETE' })
          );

          const results = await Promise.allSettled(deletePromises);
          
          const failed = results.filter(r => r.status === 'rejected').length;
          
          if (failed > 0) {
            alert(`${failed} campaign(s) failed to delete`);
          }

          setCampaigns(prev => prev.filter(c => !selectedCampaigns.has(c.id)));
          setSelectedCampaigns(new Set());
          router.refresh();
        } catch (error: any) {
          console.error('Bulk delete error:', error);
          alert(`Failed to delete campaigns: ${error.message}`);
        } finally {
          setBulkDeleting(false);
        }
      }
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 1000);
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

      {/* Bulk Actions Bar */}
      {campaigns.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedCampaigns.size === campaigns.length && campaigns.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Select All ({campaigns.length})
              </span>
            </label>
            {selectedCampaigns.size > 0 && (
              <span className="text-sm text-gray-600">
                {selectedCampaigns.size} selected
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 flex items-center gap-2"
              title="Refresh campaigns"
            >
              <svg 
                className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            
            {selectedCampaigns.size > 0 && (
              <button
                onClick={bulkDeleteCampaigns}
                disabled={bulkDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {bulkDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Selected ({selectedCampaigns.size})
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((campaign) => (
          <div
            key={campaign.id}
            className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-all overflow-hidden ${
              selectedCampaigns.has(campaign.id) 
                ? 'border-blue-500 ring-2 ring-blue-200' 
                : 'border-gray-200'
            }`}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedCampaigns.has(campaign.id)}
                    onChange={() => toggleSelectCampaign(campaign.id)}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {campaign.name || 'Unnamed Campaign'}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(campaign.status)}`}>
                        {getStatusIcon(campaign.status)} {campaign.status}
                      </span>
                      <button
                        onClick={() => refreshCampaignStatus(campaign.id)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="Refresh status from database"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>
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
