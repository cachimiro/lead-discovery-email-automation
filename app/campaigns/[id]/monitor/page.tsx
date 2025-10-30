'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function CampaignMonitorPage() {
  const params = useParams();
  const campaignId = params.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [campaignId]);

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/campaigns/debug?campaignId=${campaignId}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading campaign data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No data found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Campaign Monitor</h1>
          <p className="text-gray-600 mt-2">Real-time campaign debugging and monitoring</p>
        </div>

        {/* Campaign Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Campaign Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-semibold">Name:</span> {data.campaign?.name || 'N/A'}
            </div>
            <div>
              <span className="font-semibold">Status:</span> {data.campaign?.status || 'N/A'}
            </div>
            <div>
              <span className="font-semibold">ID:</span> {data.campaign?.id || 'N/A'}
            </div>
            <div>
              <span className="font-semibold">Created:</span> {data.campaign?.created_at ? new Date(data.campaign.created_at).toLocaleString() : 'N/A'}
            </div>
          </div>
        </div>

        {/* Email Queue Stats */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Email Queue Status</h2>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-3xl font-bold text-yellow-600">{data.emailsByStatus.pending}</div>
              <div className="text-sm text-gray-600 mt-1">Pending</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">{data.emailsByStatus.on_hold}</div>
              <div className="text-sm text-gray-600 mt-1">On Hold</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{data.emailsByStatus.sent}</div>
              <div className="text-sm text-gray-600 mt-1">Sent</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-3xl font-bold text-red-600">{data.emailsByStatus.failed}</div>
              <div className="text-sm text-gray-600 mt-1">Failed</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-gray-600">{data.emailsByStatus.cancelled}</div>
              <div className="text-sm text-gray-600 mt-1">Cancelled</div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <span className="text-lg font-semibold">Total Emails in Queue: {data.totalEmails}</span>
          </div>
        </div>

        {/* Templates */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Email Templates ({data.templates.length})</h2>
          <div className="space-y-2">
            {data.templates.map((template: any) => (
              <div key={template.id} className="p-3 bg-gray-50 rounded flex items-center justify-between">
                <div>
                  <span className="font-semibold">Template #{template.template_number}</span>
                  <span className={`ml-3 px-2 py-1 rounded text-xs ${template.is_enabled ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                    {template.is_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="text-sm text-gray-600">{template.subject}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Contacts */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Contacts ({data.contacts.length})</h2>
          <div className="text-sm text-gray-600 mb-2">
            With Industry: {data.contacts.filter((c: any) => c.industry).length} | 
            Without Industry: {data.contacts.filter((c: any) => !c.industry).length}
          </div>
        </div>

        {/* Journalist Leads */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Journalist Leads ({data.journalists.length})</h2>
          <div className="text-sm text-gray-600 mb-2">
            Active: {data.journalists.filter((j: any) => j.is_active).length} | 
            Industries: {[...new Set(data.journalists.map((j: any) => j.industry).filter(Boolean))].join(', ')}
          </div>
        </div>

        {/* Email Queue Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Email Queue Details</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipient</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheduled</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.emails.map((email: any) => (
                  <tr key={email.id}>
                    <td className="px-4 py-3 text-sm">{email.recipient_email}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        email.status === 'sent' ? 'bg-green-100 text-green-800' :
                        email.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        email.status === 'on_hold' ? 'bg-orange-100 text-orange-800' :
                        email.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {email.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {email.is_follow_up ? `Follow-up #${email.follow_up_number}` : 'Initial'}
                    </td>
                    <td className="px-4 py-3 text-sm">{new Date(email.scheduled_for).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm">{email.sent_at ? new Date(email.sent_at).toLocaleString() : '-'}</td>
                    <td className="px-4 py-3 text-sm truncate max-w-xs">{email.subject}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
