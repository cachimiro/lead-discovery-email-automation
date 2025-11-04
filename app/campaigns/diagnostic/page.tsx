'use client';

import { useEffect, useState } from 'react';

interface DiagnosticData {
  status: string;
  timestamp: string;
  issues: string[];
  warnings: string[];
  user: any;
  oauth: any;
  campaign: any;
  emailQueue: any;
  recentActivity: any[];
  environment: any;
  nextSteps: string[];
}

export default function DiagnosticPage() {
  const [data, setData] = useState<DiagnosticData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDiagnostic = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/email-automation/diagnostic');
      if (!response.ok) {
        throw new Error('Failed to fetch diagnostic data');
      }
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostic();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">Loading diagnostic data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const statusColor = 
    data.status === 'healthy' ? 'green' :
    data.status === 'warning' ? 'yellow' :
    'red';

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Email Automation Diagnostic</h1>
              <p className="text-gray-600 mt-1">Last checked: {new Date(data.timestamp).toLocaleString()}</p>
            </div>
            <button
              onClick={fetchDiagnostic}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
          
          {/* Status Badge */}
          <div className="mt-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
              ${statusColor === 'green' ? 'bg-green-100 text-green-800' : ''}
              ${statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' : ''}
              ${statusColor === 'red' ? 'bg-red-100 text-red-800' : ''}
            `}>
              {data.status === 'healthy' ? '✅ Healthy' : 
               data.status === 'warning' ? '⚠️ Warning' : 
               '❌ Error'}
            </span>
          </div>
        </div>

        {/* Issues */}
        {data.issues.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-3">❌ Critical Issues</h2>
            <ul className="space-y-2">
              {data.issues.map((issue, i) => (
                <li key={i} className="text-red-700">• {issue}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Warnings */}
        {data.warnings.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-yellow-900 mb-3">⚠️ Warnings</h2>
            <ul className="space-y-2">
              {data.warnings.map((warning, i) => (
                <li key={i} className="text-yellow-700">• {warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">📋 Next Steps</h2>
          <ul className="space-y-2">
            {data.nextSteps.map((step, i) => (
              <li key={i} className="text-blue-700">• {step}</li>
            ))}
          </ul>
        </div>

        {/* User Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">👤 User Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{data.user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium">{data.user.name}</p>
            </div>
          </div>
        </div>

        {/* OAuth Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🔐 OAuth Status</h2>
          {data.oauth ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Provider</p>
                <p className="font-medium capitalize">{data.oauth.provider}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Token Status</p>
                <p className={`font-medium ${data.oauth.isExpired ? 'text-red-600' : 'text-green-600'}`}>
                  {data.oauth.isExpired ? 'Expired' : 'Valid'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Expires At</p>
                <p className="font-medium text-sm">
                  {data.oauth.expiresAt ? new Date(data.oauth.expiresAt).toLocaleString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="font-medium text-sm">
                  {new Date(data.oauth.lastUpdated).toLocaleString()}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-red-600">No OAuth tokens found. Please sign in with Google or Microsoft.</p>
          )}
        </div>

        {/* Campaign Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📧 Latest Campaign</h2>
          {data.campaign ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{data.campaign.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className={`font-medium ${
                  data.campaign.status === 'active' ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {data.campaign.status}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="font-medium text-sm">
                  {new Date(data.campaign.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Updated</p>
                <p className="font-medium text-sm">
                  {new Date(data.campaign.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">No campaigns found.</p>
          )}
        </div>

        {/* Email Queue */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📬 Email Queue</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {Object.entries(data.emailQueue.byStatus).map(([status, count]) => (
                <div key={status} className="text-center p-3 bg-gray-50 rounded">
                  <p className="text-2xl font-bold text-gray-900">{count as number}</p>
                  <p className="text-sm text-gray-600 capitalize">{status}</p>
                </div>
              ))}
            </div>
            
            {data.emailQueue.pending.total > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-2">Pending Emails</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Should Send Now</p>
                    <p className="font-medium text-lg">{data.emailQueue.pending.shouldSendNow}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Scheduled for Future</p>
                    <p className="font-medium text-lg">{data.emailQueue.pending.scheduledForFuture}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Earliest Scheduled</p>
                    <p className="font-medium">
                      {data.emailQueue.pending.earliestScheduled 
                        ? new Date(data.emailQueue.pending.earliestScheduled).toLocaleString()
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Latest Scheduled</p>
                    <p className="font-medium">
                      {data.emailQueue.pending.latestScheduled 
                        ? new Date(data.emailQueue.pending.latestScheduled).toLocaleString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        {data.recentActivity.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 Recent Activity</h2>
            <div className="space-y-2">
              {data.recentActivity.map((log, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{log.event_type}</p>
                    <p className="text-sm text-gray-600">{log.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Environment */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">⚙️ Environment</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">CRON_SECRET Set</p>
              <p className={`font-medium ${data.environment.cronSecretSet ? 'text-green-600' : 'text-red-600'}`}>
                {data.environment.cronSecretSet ? 'Yes ✅' : 'No ❌'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Environment</p>
              <p className="font-medium">{data.environment.nodeEnv}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
