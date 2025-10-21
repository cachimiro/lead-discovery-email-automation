'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface EmailTemplate {
  number: number;
  subject: string;
  body: string;
}

interface Lead {
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  title?: string;
}

interface PreviewEmail {
  lead: Lead;
  emails: {
    subject: string;
    body: string;
    number: number;
  }[];
}

export default function PreviewCampaignPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;

  const [previews, setPreviews] = useState<PreviewEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [campaignName, setCampaignName] = useState('');

  useEffect(() => {
    fetchPreview();
  }, []);

  const fetchPreview = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/preview`);
      const data = await response.json();
      
      setPreviews(data.previews || []);
      setCampaignName(data.campaignName || '');
    } catch (error) {
      console.error('Error fetching preview:', error);
    } finally {
      setLoading(false);
    }
  };

  const replaceVariables = (text: string, lead: Lead): string => {
    return text
      .replace(/\{\{first_name\}\}/g, lead.first_name || '')
      .replace(/\{\{last_name\}\}/g, lead.last_name || '')
      .replace(/\{\{email\}\}/g, lead.email || '')
      .replace(/\{\{company\}\}/g, lead.company || '')
      .replace(/\{\{title\}\}/g, lead.title || '');
  };

  const handleStartCampaign = async () => {
    if (!confirm(`Start campaign "${campaignName}"? This will begin sending emails immediately.`)) {
      return;
    }

    setStarting(true);

    try {
      const response = await fetch('/api/email-automation/start-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          maxEmailsPerDay: 28,
          sendingStartHour: 9,
          sendingEndHour: 17,
          followUpDelayDays: 3,
          skipWeekends: true
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Campaign started! ${data.stats.emails_queued} emails queued for sending.`);
        router.push(`/campaigns/${campaignId}/dashboard`);
      } else {
        alert('Failed to start campaign: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error starting campaign:', error);
      alert('Failed to start campaign');
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading preview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Preview Campaign</h1>
          <p className="mt-2 text-gray-600">
            Step 3: Review how your emails will look with real data
          </p>
        </div>

        {/* Campaign Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{campaignName}</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">Total Recipients</div>
              <div className="text-2xl font-bold text-gray-900">{previews.length}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Emails per Sequence</div>
              <div className="text-2xl font-bold text-blue-600">
                {previews[0]?.emails.length || 0}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Emails</div>
              <div className="text-2xl font-bold text-green-600">
                {previews.length * (previews[0]?.emails.length || 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Preview Examples */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📧 Preview: 3 Example Recipients
          </h3>
          
          <div className="grid gap-6 lg:grid-cols-3">
            {previews.slice(0, 3).map((preview, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Recipient Info */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
                  <div className="font-semibold">{preview.lead.first_name} {preview.lead.last_name}</div>
                  <div className="text-sm opacity-90">{preview.lead.email}</div>
                  <div className="text-sm opacity-75">{preview.lead.company}</div>
                </div>

                {/* Email Sequence */}
                <div className="p-4 space-y-4">
                  {preview.emails.map((email, emailIdx) => (
                    <div key={emailIdx} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-blue-600 uppercase">
                          {emailIdx === 0 ? 'Initial Email' : `Follow-up #${emailIdx}`}
                        </span>
                        <span className="text-xs text-gray-500">
                          {emailIdx === 0 ? 'Day 1' : `Day ${1 + emailIdx * 3}`}
                        </span>
                      </div>
                      
                      <div className="mb-2">
                        <div className="text-xs text-gray-500 mb-1">Subject:</div>
                        <div className="text-sm font-medium text-gray-900">
                          {replaceVariables(email.subject, preview.lead)}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Body:</div>
                        <div className="text-xs text-gray-700 whitespace-pre-wrap max-h-32 overflow-y-auto">
                          {replaceVariables(email.body, preview.lead)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Sending Timeline</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="w-24 text-sm font-medium text-gray-700">Day 1</div>
              <div className="flex-1 h-2 bg-blue-600 rounded"></div>
              <div className="text-sm text-gray-600">Initial email sent (28/day)</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-24 text-sm font-medium text-gray-700">Day 4</div>
              <div className="flex-1 h-2 bg-blue-500 rounded"></div>
              <div className="text-sm text-gray-600">Follow-up #1 (if no response)</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-24 text-sm font-medium text-gray-700">Day 7</div>
              <div className="flex-1 h-2 bg-blue-400 rounded"></div>
              <div className="text-sm text-gray-600">Follow-up #2 (if no response)</div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
            ⏰ Emails sent Monday-Friday, 9am-5pm • Maximum 28 emails per day • 
            Follow-ups automatically cancelled when recipient replies
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push(`/campaigns/${campaignId}/select-leads`)}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
          >
            ← Back to Lead Selection
          </button>
          
          <button
            onClick={handleStartCampaign}
            disabled={starting}
            className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {starting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Starting Campaign...
              </>
            ) : (
              <>
                🚀 Start Campaign
              </>
            )}
          </button>
        </div>

        {/* Warning */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ <strong>Important:</strong> Once started, the campaign will begin sending emails immediately. 
            Make sure you've reviewed all email content and selected the correct recipients.
          </p>
        </div>
      </div>
    </div>
  );
}
