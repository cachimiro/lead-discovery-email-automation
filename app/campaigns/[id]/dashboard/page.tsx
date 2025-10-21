'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface CampaignStats {
  campaign: {
    id: string;
    name: string;
    status: string;
  };
  stats: {
    total_emails: number;
    pending: number;
    sent: number;
    failed: number;
    cancelled: number;
    response_received: number;
    response_count: number;
    response_rate: string;
  };
  today: {
    emails_sent: number;
    max_emails: number;
    remaining: number;
  };
  next_email: {
    scheduled_for: string;
    recipient: string;
    is_follow_up: boolean;
    follow_up_number: number;
  } | null;
}

export default function CampaignDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;

  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [stopping, setStopping] = useState(false);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/email-automation/stats?campaignId=${campaignId}`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStopCampaign = async () => {
    if (!confirm('Stop this campaign? Pending emails will be cancelled.')) {
      return;
    }

    setStopping(true);

    try {
      const response = await fetch('/api/email-automation/stop-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          reason: 'Manually stopped by user'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Campaign stopped. ${data.stats.emails_cancelled} pending emails cancelled.`);
        fetchStats();
      }
    } catch (error) {
      console.error('Error stopping campaign:', error);
      alert('Failed to stop campaign');
    } finally {
      setStopping(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Campaign not found</p>
        </div>
      </div>
    );
  }

  const progressPercent = stats.stats.total_emails > 0
    ? ((stats.stats.sent + stats.stats.failed + stats.stats.cancelled + stats.stats.response_received) / stats.stats.total_emails) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{stats.campaign.name}</h1>
            <p className="mt-2 text-gray-600">Campaign Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
              stats.campaign.status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {stats.campaign.status === 'active' ? '🟢 Active' : '⏸️ Paused'}
            </span>
            {stats.campaign.status === 'active' && (
              <button
                onClick={handleStopCampaign}
                disabled={stopping}
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-300"
              >
                {stopping ? 'Stopping...' : 'Stop Campaign'}
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Campaign Progress</span>
            <span className="text-sm font-semibold text-gray-900">{progressPercent.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-600 to-green-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {stats.stats.sent + stats.stats.response_received} of {stats.stats.total_emails} emails processed
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-3xl font-bold text-blue-600">{stats.stats.sent}</div>
            <div className="text-sm text-gray-600">Sent</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-3xl font-bold text-yellow-600">{stats.stats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-3xl font-bold text-green-600">{stats.stats.response_count}</div>
            <div className="text-sm text-gray-600">Responses</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-3xl font-bold text-purple-600">{stats.stats.response_rate}</div>
            <div className="text-sm text-gray-600">Response Rate</div>
          </div>
        </div>

        {/* Today's Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Today's Activity</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.today.emails_sent}</div>
              <div className="text-sm text-gray-600">Emails Sent Today</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats.today.remaining}</div>
              <div className="text-sm text-gray-600">Remaining Today</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.today.max_emails}</div>
              <div className="text-sm text-gray-600">Daily Limit</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${(stats.today.emails_sent / stats.today.max_emails) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Next Email */}
        {stats.next_email && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">⏰ Next Email</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Scheduled For</div>
                <div className="text-lg font-semibold text-gray-900">
                  {new Date(stats.next_email.scheduled_for).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Recipient</div>
                <div className="text-lg font-semibold text-gray-900">{stats.next_email.recipient}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Type</div>
                <div className="text-lg font-semibold text-gray-900">
                  {stats.next_email.is_follow_up 
                    ? `Follow-up #${stats.next_email.follow_up_number - 1}` 
                    : 'Initial Email'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Stats */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Detailed Statistics</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-700">Total Emails</span>
              <span className="font-semibold text-gray-900">{stats.stats.total_emails}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-700">✅ Sent</span>
              <span className="font-semibold text-blue-600">{stats.stats.sent}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-700">⏳ Pending</span>
              <span className="font-semibold text-yellow-600">{stats.stats.pending}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-700">💬 Responses Received</span>
              <span className="font-semibold text-green-600">{stats.stats.response_received}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-700">❌ Failed</span>
              <span className="font-semibold text-red-600">{stats.stats.failed}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-700">🚫 Cancelled</span>
              <span className="font-semibold text-gray-600">{stats.stats.cancelled}</span>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <button
            onClick={() => router.push('/campaigns')}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
          >
            ← Back to Campaigns
          </button>
        </div>
      </div>
    </div>
  );
}
