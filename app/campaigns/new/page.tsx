'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [campaignName, setCampaignName] = useState('');
  const [emails, setEmails] = useState([
    { number: 1, subject: '', body: '', enabled: true },
    { number: 2, subject: '', body: '', enabled: false },
    { number: 3, subject: '', body: '', enabled: false }
  ]);

  const handleAddFollowUp = (index: number) => {
    const newEmails = [...emails];
    newEmails[index].enabled = true;
    setEmails(newEmails);
  };

  const handleRemoveFollowUp = (index: number) => {
    const newEmails = [...emails];
    newEmails[index].enabled = false;
    newEmails[index].subject = '';
    newEmails[index].body = '';
    setEmails(newEmails);
  };

  const handleEmailChange = (index: number, field: 'subject' | 'body', value: string) => {
    const newEmails = [...emails];
    newEmails[index][field] = value;
    setEmails(newEmails);
  };

  const handleSaveCampaign = async () => {
    try {
      // Save campaign
      const response = await fetch('/api/campaigns/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName,
          emails: emails.filter(e => e.enabled)
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Go to lead selection
        router.push(`/campaigns/${data.campaignId}/select-leads`);
      }
    } catch (error) {
      console.error('Error saving campaign:', error);
      alert('Failed to save campaign');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Campaign</h1>
          <p className="mt-2 text-gray-600">
            Step 1: Create your email sequence with follow-ups
          </p>
        </div>

        {/* Campaign Name */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Campaign Name
          </label>
          <input
            type="text"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            placeholder="e.g., Tech Journalists Q1 2024"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Email Templates */}
        <div className="space-y-4">
          {emails.map((email, index) => (
            <div key={index}>
              {email.enabled ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {index === 0 ? 'Initial Email' : `Follow-up #${index}`}
                    </h3>
                    {index > 0 && (
                      <button
                        onClick={() => handleRemoveFollowUp(index)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject Line
                      </label>
                      <input
                        type="text"
                        value={email.subject}
                        onChange={(e) => handleEmailChange(index, 'subject', e.target.value)}
                        placeholder="Use {{first_name}}, {{company}}, etc."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Body
                      </label>
                      <textarea
                        value={email.body}
                        onChange={(e) => handleEmailChange(index, 'body', e.target.value)}
                        placeholder="Hi {{first_name}},&#10;&#10;I noticed {{company}} is doing great work in...&#10;&#10;Available variables: {{first_name}}, {{last_name}}, {{company}}, {{email}}"
                        rows={8}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      />
                    </div>
                  </div>

                  {index === 0 && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        💡 <strong>Tip:</strong> Use variables like {'{'}{'{'} first_name {'}'}{'}'}  to personalize emails automatically
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => handleAddFollowUp(index)}
                  className="w-full bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 p-6 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">➕</div>
                    <div className="text-lg font-semibold text-gray-900">
                      Add Follow-up #{index}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Sent 3 business days after {index === 1 ? 'initial email' : `follow-up #${index - 1}`}
                    </div>
                  </div>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => router.push('/campaigns')}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSaveCampaign}
            disabled={!campaignName || !emails[0].subject || !emails[0].body}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Save & Select Leads →
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">📧 How it works:</h4>
          <ul className="space-y-1 text-sm text-gray-700">
            <li>• <strong>Initial Email:</strong> Sent immediately when campaign starts</li>
            <li>• <strong>Follow-up #1:</strong> Sent 3 business days later (if no response)</li>
            <li>• <strong>Follow-up #2:</strong> Sent 3 business days after follow-up #1 (if no response)</li>
            <li>• <strong>Rate Limit:</strong> Maximum 28 emails per day (9am-5pm)</li>
            <li>• <strong>Auto-Stop:</strong> Follow-ups automatically cancelled when recipient replies</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
