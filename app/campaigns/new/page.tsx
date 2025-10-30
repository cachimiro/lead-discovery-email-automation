'use client';

import { useState, useRef } from 'react';
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
  const [activeField, setActiveField] = useState<{ index: number; field: 'subject' | 'body' } | null>(null);
  const subjectRefs = useRef<(HTMLInputElement | null)[]>([]);
  const bodyRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

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

  const insertVariable = (variable: string) => {
    if (!activeField) return;

    const { index, field } = activeField;
    const ref = field === 'subject' ? subjectRefs.current[index] : bodyRefs.current[index];
    
    if (!ref) return;

    const start = ref.selectionStart || 0;
    const end = ref.selectionEnd || 0;
    const currentValue = emails[index][field];
    const newValue = currentValue.substring(0, start) + variable + currentValue.substring(end);
    
    handleEmailChange(index, field, newValue);
    
    // Set cursor position after the inserted variable
    setTimeout(() => {
      ref.focus();
      const newPosition = start + variable.length;
      ref.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const variables = [
    // Journalist Lead Variables
    { 
      name: 'Journalist First Name', 
      value: '{{journalist_first_name}}', 
      icon: '✍️', 
      description: 'First name of the journalist you\'re pitching to',
      category: 'Journalist'
    },
    { 
      name: 'Journalist Last Name', 
      value: '{{journalist_last_name}}', 
      icon: '✍️', 
      description: 'Last name of the journalist',
      category: 'Journalist'
    },
    { 
      name: 'Publication', 
      value: '{{publication}}', 
      icon: '📰', 
      description: 'Publication or media outlet the journalist works for',
      category: 'Journalist'
    },
    { 
      name: 'Topic', 
      value: '{{topic}}', 
      icon: '📝', 
      description: 'Subject or topic the journalist covers',
      category: 'Journalist'
    },
    { 
      name: 'Journalist Industry', 
      value: '{{journalist_industry}}', 
      icon: '🏭', 
      description: 'Industry the journalist focuses on',
      category: 'Journalist'
    },
    { 
      name: 'Notes', 
      value: '{{notes}}', 
      icon: '📋', 
      description: 'Additional notes about the journalist',
      category: 'Journalist'
    },
    
    // User/Lead Variables (people we're reaching out to)
    { 
      name: 'User First Name', 
      value: '{{user_first_name}}', 
      icon: '👤', 
      description: 'First name of the person you\'re reaching out to',
      category: 'Lead'
    },
    { 
      name: 'User Last Name', 
      value: '{{user_last_name}}', 
      icon: '👤', 
      description: 'Last name of the person you\'re reaching out to',
      category: 'Lead'
    },
    { 
      name: 'User Company', 
      value: '{{user_company}}', 
      icon: '🏢', 
      description: 'Company name of the person you\'re reaching out to',
      category: 'Lead'
    },
    { 
      name: 'User Industry', 
      value: '{{user_industry}}', 
      icon: '🏭', 
      description: 'Industry of the company you\'re reaching out to',
      category: 'Lead'
    },
    { 
      name: 'User Email', 
      value: '{{user_email}}', 
      icon: '📧', 
      description: 'Email address of the person you\'re reaching out to',
      category: 'Lead'
    }
  ];

  const handleSaveCampaign = async () => {
    try {
      // Save campaign
      const response = await fetch('/api/campaigns/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName,
          emails: emails.filter(e => e.enabled),
          autoMatch: true // Enable auto-matching by industry
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Go to pool selection page
        router.push(`/campaigns/${data.campaignId}/select-pools`);
      } else {
        alert(data.error || 'Failed to save campaign');
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

        {/* Variable Picker */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            📝 Personalization Variables
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Click a variable to insert it at your cursor position. Hover over each button to see what it does.
          </p>
          
          {/* Journalist Variables */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">✍️ Journalist Information</h4>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              {variables.filter(v => v.category === 'Journalist').map((variable) => (
                <button
                  key={variable.value}
                  onClick={() => insertVariable(variable.value)}
                  disabled={!activeField}
                  className="relative flex flex-col items-center p-2 bg-white rounded-lg border-2 border-blue-200 hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-blue-200 disabled:hover:bg-white group"
                  title={variable.description}
                >
                  <div className="text-xl mb-1">{variable.icon}</div>
                  <div className="text-xs font-semibold text-gray-900 text-center leading-tight">{variable.name}</div>
                  <div className="text-xs text-gray-500 mt-1 font-mono text-center break-all">{variable.value}</div>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                    {variable.description}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Lead/User Variables */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">👤 Lead Information (Person You're Reaching Out To)</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {variables.filter(v => v.category === 'Lead').map((variable) => (
                <button
                  key={variable.value}
                  onClick={() => insertVariable(variable.value)}
                  disabled={!activeField}
                  className="relative flex flex-col items-center p-2 bg-white rounded-lg border-2 border-green-200 hover:border-green-500 hover:bg-green-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-green-200 disabled:hover:bg-white group"
                  title={variable.description}
                >
                  <div className="text-xl mb-1">{variable.icon}</div>
                  <div className="text-xs font-semibold text-gray-900 text-center leading-tight">{variable.name}</div>
                  <div className="text-xs text-gray-500 mt-1 font-mono text-center break-all">{variable.value}</div>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-normal max-w-xs z-10 shadow-lg">
                    {variable.description}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {!activeField && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              💡 <strong>Tip:</strong> Click in a subject or body field below, then click a variable button to insert it. Hover over buttons to see descriptions.
            </div>
          )}
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
            <strong>Auto-Matching:</strong> When you send the campaign, leads will be automatically matched with journalists by industry. 
            For example, if a lead is in the "sleep" industry, they'll be paired with journalists who cover the sleep industry.
          </div>
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
                        ref={(el) => { subjectRefs.current[index] = el; }}
                        type="text"
                        value={email.subject}
                        onChange={(e) => handleEmailChange(index, 'subject', e.target.value)}
                        onFocus={() => setActiveField({ index, field: 'subject' })}
                        placeholder="Click here, then click a variable above to insert"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Body
                      </label>
                      <textarea
                        ref={(el) => { bodyRefs.current[index] = el; }}
                        value={email.body}
                        onChange={(e) => handleEmailChange(index, 'body', e.target.value)}
                        onFocus={() => setActiveField({ index, field: 'body' })}
                        placeholder="Click here, then click variables above to insert them.&#10;&#10;Example:&#10;Hi {{first_name}},&#10;&#10;I noticed {{company}} is doing great work in..."
                        rows={8}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      />
                    </div>
                  </div>

                  {index === 0 && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        ✅ <strong>Quick Start:</strong> Click in a field above, then click a variable button to insert it. Variables will be automatically replaced with real contact data when emails are sent.
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
