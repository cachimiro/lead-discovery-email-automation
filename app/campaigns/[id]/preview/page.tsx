'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface EmailTemplate {
  number: number;
  subject: string;
  body: string;
}

interface UserLead {
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  industry: string;
}

interface Journalist {
  first_name: string;
  last_name: string;
  publication: string;
  topic: string;
  industry: string;
  notes?: string;
}

interface PreviewEmail {
  userLead: UserLead;
  journalist: Journalist;
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
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [skippedContacts, setSkippedContacts] = useState(0);
  const [contactsWithoutIndustry, setContactsWithoutIndustry] = useState<any[]>([]);
  const [contactsWithNonMatchingIndustry, setContactsWithNonMatchingIndustry] = useState<any[]>([]);
  const [showIndustryModal, setShowIndustryModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [newIndustry, setNewIndustry] = useState('');
  const [availableIndustries, setAvailableIndustries] = useState<string[]>([]);
  const [customIndustry, setCustomIndustry] = useState('');
  const [modalDismissed, setModalDismissed] = useState(false);

  useEffect(() => {
    fetchPreview();
  }, [campaignId]);

  useEffect(() => {
    // Auto-select all emails when previews load
    if (previews.length > 0 && selectedEmails.size === 0) {
      const allEmails = new Set(previews.map(p => p.userLead.email));
      setSelectedEmails(allEmails);
    }
  }, [previews]);

  const fetchPreview = async () => {
    try {
      // Get pool IDs from URL if present
      const urlParams = new URLSearchParams(window.location.search);
      const pools = urlParams.get('pools');
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const url = pools 
        ? `/api/campaigns/${campaignId}/preview?pools=${pools}&_t=${timestamp}`
        : `/api/campaigns/${campaignId}/preview?_t=${timestamp}`;
      
      console.log('Fetching preview from:', url);
      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      const data = await response.json();
      console.log('Preview data:', JSON.stringify({
        previewsCount: data.previews?.length || 0,
        contactsWithoutIndustry: data.warnings?.contactsWithoutIndustry?.length || 0,
        contactsWithNonMatchingIndustry: data.warnings?.contactsWithNonMatchingIndustry?.length || 0,
        availableIndustries: data.availableIndustries,
        contactsWithoutIndustryList: data.warnings?.contactsWithoutIndustry,
        contactsWithNonMatchingIndustryList: data.warnings?.contactsWithNonMatchingIndustry
      }, null, 2));
      
      if (!response.ok) {
        console.error('Preview API error:', data);
        alert(`Error: ${data.error || 'Failed to load preview'}`);
      }
      
      setPreviews(data.previews || []);
      setCampaignName(data.campaignName || 'Campaign');
      setSkippedContacts(data.skippedContacts || 0);
      setAvailableIndustries(data.availableIndustries || []);
      
      // Handle warnings
      if (data.warnings) {
        const contactsWithoutInd = data.warnings.contactsWithoutIndustry || [];
        setContactsWithoutIndustry(contactsWithoutInd);
        setContactsWithNonMatchingIndustry(data.warnings.contactsWithNonMatchingIndustry || []);
        // Don't auto-show modal - let users click the buttons to update
      }
    } catch (error) {
      console.error('Error fetching preview:', error);
      alert('Failed to load campaign preview');
    } finally {
      setLoading(false);
    }
  };

  const toggleEmailSelection = (email: string) => {
    const newSelected = new Set(selectedEmails);
    if (newSelected.has(email)) {
      newSelected.delete(email);
    } else {
      newSelected.add(email);
    }
    setSelectedEmails(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedEmails.size === previews.length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(previews.map(p => p.userLead.email)));
    }
  };

  const replaceVariables = (text: string, userLead: UserLead, journalist: Journalist): string => {
    return text
      // Journalist variables
      .replace(/\{\{journalist_first_name\}\}/g, journalist.first_name || '')
      .replace(/\{\{journalist_last_name\}\}/g, journalist.last_name || '')
      .replace(/\{\{publication\}\}/g, journalist.publication || '')
      .replace(/\{\{topic\}\}/g, journalist.topic || '')
      .replace(/\{\{journalist_industry\}\}/g, journalist.industry || '')
      .replace(/\{\{notes\}\}/g, journalist.notes || '')
      // User/Lead variables
      .replace(/\{\{user_first_name\}\}/g, userLead.first_name || '')
      .replace(/\{\{user_last_name\}\}/g, userLead.last_name || '')
      .replace(/\{\{user_email\}\}/g, userLead.email || '')
      .replace(/\{\{user_company\}\}/g, userLead.company || '')
      .replace(/\{\{user_industry\}\}/g, userLead.industry || '');
  };

  const handleStartCampaign = async () => {
    if (selectedEmails.size === 0) {
      alert('Please select at least one contact to send to');
      return;
    }

    if (!confirm(`Start campaign "${campaignName}" for ${selectedEmails.size} selected contact(s)? This will begin sending emails immediately.`)) {
      return;
    }

    setStarting(true);

    try {
      // Filter previews to only include selected emails
      const selectedPreviews = previews.filter(p => selectedEmails.has(p.userLead.email));

      const response = await fetch('/api/email-automation/start-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          selectedEmails: Array.from(selectedEmails),
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

  const handleUpdateIndustry = async (contactId: string, industry: string) => {
    try {
      console.log('Updating industry for contact:', contactId, 'to:', industry);
      
      const response = await fetch(`/api/contacts/${contactId}/update-industry`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry })
      });

      const data = await response.json();
      console.log('Update industry response:', JSON.stringify(data, null, 2));

      if (data.success) {
        console.log('Industry updated successfully, contact data:', JSON.stringify({
          id: data.contact?.id,
          email: data.contact?.email,
          industry: data.contact?.industry,
          updated_at: data.contact?.updated_at
        }, null, 2));
        
        // Close modal first
        setShowIndustryModal(false);
        setSelectedContact(null);
        
        // Refresh the preview to get updated matches
        console.log('Refreshing preview...');
        await fetchPreview();
        console.log('Preview refreshed');
        
        alert('✅ Industry updated successfully! Preview refreshed.');
      } else {
        console.error('Update failed:', data.error);
        alert('Failed to update industry: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating industry:', error);
      alert('Failed to update industry');
    }
  };

  const handleSkipIndustryUpdate = () => {
    setShowIndustryModal(false);
    setModalDismissed(true); // Mark as dismissed so it doesn't reopen
    // Contacts will still be added to campaign but won't get first email
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

  // Check if we have no matched pairs
  const hasNoMatches = previews.length === 0;
  const hasContactsNeedingIndustry = contactsWithoutIndustry.length > 0 || contactsWithNonMatchingIndustry.length > 0;

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

        {/* Show warning if no matches */}
        {hasNoMatches && hasContactsNeedingIndustry && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-semibold text-yellow-900">No Matched Contacts Yet</h3>
                <p className="mt-2 text-sm text-yellow-700">
                  Your contacts need industries that match your journalist leads before emails can be sent.
                  {contactsWithoutIndustry.length > 0 && ` ${contactsWithoutIndustry.length} contact(s) are missing an industry.`}
                  {contactsWithNonMatchingIndustry.length > 0 && ` ${contactsWithNonMatchingIndustry.length} contact(s) have industries that don't match any journalist leads.`}
                </p>
                <p className="mt-2 text-sm text-yellow-700 font-medium">
                  Please update the industries below to see the preview and proceed.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Campaign Info */}
        {!hasNoMatches && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border-2 border-blue-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{campaignName}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Total Contacts</div>
                <div className="text-3xl font-bold text-gray-900">{previews.length}</div>
                <div className="text-xs text-gray-600 mt-2">Matched by industry</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Selected</div>
                <div className="text-3xl font-bold text-blue-600">{selectedEmails.size}</div>
                <div className="text-xs text-gray-600 mt-2">Will receive emails</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Emails Each</div>
                <div className="text-3xl font-bold text-purple-600">
                  {previews[0]?.emails.length || 0}
                </div>
                <div className="text-xs text-gray-600 mt-2">Initial + follow-ups</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Total Emails</div>
                <div className="text-3xl font-bold text-green-600">
                  {selectedEmails.size * (previews[0]?.emails.length || 0)}
                </div>
                <div className="text-xs text-gray-600 mt-2">To be sent</div>
              </div>
            </div>
          </div>
        )}

        {/* Selection Controls */}
        {!hasNoMatches && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Select Recipients</h3>
                <p className="text-sm text-gray-600">
                  {selectedEmails.size} of {previews.length} contacts selected
                </p>
              </div>
              <button
                onClick={toggleSelectAll}
                className="px-6 py-3 bg-white border-2 border-blue-300 rounded-lg font-semibold text-blue-700 hover:bg-blue-50 transition-colors shadow-sm"
              >
                {selectedEmails.size === previews.length ? '✓ Deselect All' : 'Select All'}
              </button>
            </div>
          </div>
        )}

        {/* Follow-up Warning */}
        {!hasNoMatches && previews.length > 0 && previews[0].emails.length > 1 && (
          <div className="mb-6 p-6 bg-orange-50 border-2 border-orange-300 rounded-xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="text-lg font-bold text-orange-900 mb-2">
                  ⚠️ Multiple Email Templates Detected
                </h4>
                <p className="text-sm text-orange-800 mb-3">
                  You have <strong>{previews[0].emails.length} email templates</strong> enabled. This means each contact will receive {previews[0].emails.length} emails over {previews[0].emails.length === 2 ? '4 days' : '7 days'}.
                </p>
                <p className="text-sm text-orange-800">
                  If you only want to send the initial email (no follow-ups), click the button to disable the follow-up templates.
                </p>
              </div>
              <button
                onClick={async () => {
                  if (confirm('This will disable follow-up emails. Only the initial email will be sent. Continue?')) {
                    try {
                      setLoading(true);
                      // Disable templates 2 and 3
                      const res1 = await fetch('/api/templates/toggle', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ templateNumber: 2, enabled: false })
                      });
                      const res2 = await fetch('/api/templates/toggle', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ templateNumber: 3, enabled: false })
                      });
                      
                      if (res1.ok && res2.ok) {
                        alert('✅ Follow-up emails disabled!');
                        await fetchPreview();
                      } else {
                        alert('❌ Failed to disable follow-ups. Please try again.');
                      }
                    } catch (error) {
                      console.error('Error disabling follow-ups:', error);
                      alert('❌ Failed to disable follow-ups');
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
                className="px-6 py-3 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition-colors shadow-lg whitespace-nowrap"
              >
                🚫 Disable Follow-ups
              </button>
            </div>
          </div>
        )}

        {/* Preview Example */}
        {!hasNoMatches && previews.length > 0 && (
          <div className="mb-8">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                📧 Email Preview
              </h3>
              <p className="text-sm text-gray-600">
                See how your emails will look with real data. Showing {previews[0].emails.length} email{previews[0].emails.length > 1 ? 's' : ''} per contact.
              </p>
            </div>
          
            {/* Single Preview - First Contact */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              {/* Matched Pair Header */}
              <div className="grid md:grid-cols-2 gap-0">
                {/* User Lead */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white">
                  <div className="text-xs font-bold uppercase tracking-wide mb-3 opacity-90">Your Contact</div>
                  <div className="text-xl font-bold mb-2">{previews[0].userLead.first_name} {previews[0].userLead.last_name}</div>
                  <div className="text-sm opacity-90 mb-1">{previews[0].userLead.email}</div>
                  <div className="text-sm opacity-90 mb-1">{previews[0].userLead.company}</div>
                  <div className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                    {previews[0].userLead.industry}
                  </div>
                </div>

                {/* Journalist */}
                <div className="bg-gradient-to-br from-green-600 to-green-700 p-6 text-white">
                  <div className="text-xs font-bold uppercase tracking-wide mb-3 opacity-90">Matched Journalist</div>
                  <div className="text-xl font-bold mb-2">{previews[0].journalist.first_name} {previews[0].journalist.last_name}</div>
                  <div className="text-sm opacity-90 mb-1">{previews[0].journalist.publication}</div>
                  <div className="text-sm opacity-90 mb-1">Topic: {previews[0].journalist.topic}</div>
                  <div className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                    {previews[0].journalist.industry}
                  </div>
                </div>
              </div>

              {/* Email Sequence */}
              <div className="p-6 space-y-6 bg-gray-50">
                {previews[0].emails.map((email, emailIdx) => (
                  <div key={emailIdx} className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
                    {/* Email Header */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-blue-600 uppercase tracking-wide">
                          {emailIdx === 0 ? '📨 Initial Email' : `📬 Follow-up #${emailIdx}`}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {emailIdx === 0 ? 'Day 1' : `Day ${1 + emailIdx * 3}`}
                        </span>
                      </div>
                      
                      {/* Subject Line */}
                      <div className="mb-3">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Subject Line</div>
                        <div className="text-base font-semibold text-gray-900 leading-relaxed">
                          {replaceVariables(email.subject, previews[0].userLead, previews[0].journalist)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Email Body */}
                    <div className="px-6 py-5">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Email Body</div>
                      <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {replaceVariables(email.body, previews[0].userLead, previews[0].journalist)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        {!hasNoMatches && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">📅 Sending Timeline</h3>
            <div className="space-y-5">
              <div className="flex items-center gap-6">
                <div className="w-20 text-base font-bold text-gray-900">Day 1</div>
                <div className="flex-1 h-3 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full shadow-sm"></div>
                <div className="text-sm text-gray-700 font-medium">Initial email sent</div>
              </div>
              <div className="flex items-center gap-6">
                <div className="w-20 text-base font-bold text-gray-900">Day 4</div>
                <div className="flex-1 h-3 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full shadow-sm"></div>
                <div className="text-sm text-gray-700 font-medium">Follow-up #1 (if no response)</div>
              </div>
              <div className="flex items-center gap-6">
                <div className="w-20 text-base font-bold text-gray-900">Day 7</div>
                <div className="flex-1 h-3 bg-gradient-to-r from-blue-400 to-blue-300 rounded-full shadow-sm"></div>
                <div className="text-sm text-gray-700 font-medium">Follow-up #2 (if no response)</div>
              </div>
            </div>
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⏰</span>
                <div className="text-sm text-gray-700 leading-relaxed">
                  <strong>Smart Sending:</strong> Emails sent Monday-Friday, 9am-5pm • Maximum 28 emails per day • 
                  Follow-ups automatically cancelled when recipient replies
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => router.push(`/campaigns/${campaignId}/select-leads`)}
            className="px-8 py-4 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
          >
            ← Back to Lead Selection
          </button>
          
          {!hasNoMatches && (
            <button
              onClick={handleStartCampaign}
              disabled={starting || selectedEmails.size === 0}
              className="px-10 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold text-lg hover:from-green-700 hover:to-green-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center gap-3 shadow-lg hover:shadow-xl transition-all"
            >
            {starting ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <span>Starting Campaign...</span>
              </>
            ) : (
              <>
                <span className="text-2xl">🚀</span>
                <span>Start Campaign ({selectedEmails.size} contacts)</span>
              </>
            )}
            </button>
          )}
        </div>

        {/* Warning Banner */}
        {!hasNoMatches && (
          <div className="mt-6 p-5 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-semibold text-yellow-900 mb-1">Important: Review Before Starting</p>
                <p className="text-sm text-yellow-800">
                  Once started, the campaign will begin sending emails immediately. Make sure you've reviewed all email content and selected the correct recipients.
                </p>
              </div>
            </div>
          </div>
        )}



        {/* Contacts Needing Industry Updates */}
        {(contactsWithoutIndustry.length > 0 || contactsWithNonMatchingIndustry.length > 0) && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Update Contact Industries
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              These contacts need industry updates to match with journalist leads. Available industries: {availableIndustries.join(', ')}
            </p>

            {/* Contacts without industry */}
            {contactsWithoutIndustry.length > 0 && (
              <div className="mb-6">
                <h4 className="text-md font-semibold text-red-700 mb-3">
                  Missing Industry ({contactsWithoutIndustry.length})
                </h4>
                <div className="space-y-2">
                  {contactsWithoutIndustry.map((contact: any) => (
                    <div key={contact.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {contact.first_name} {contact.last_name}
                        </div>
                        <div className="text-sm text-gray-600">{contact.email}</div>
                        {contact.company && (
                          <div className="text-xs text-gray-500">{contact.company}</div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedContact(contact);
                          setNewIndustry('');
                          setCustomIndustry('');
                          setShowIndustryModal(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                      >
                        Add Industry
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contacts with non-matching industry */}
            {contactsWithNonMatchingIndustry.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-yellow-700 mb-3">
                  Non-Matching Industry ({contactsWithNonMatchingIndustry.length})
                </h4>
                <div className="space-y-2">
                  {contactsWithNonMatchingIndustry.map((contact: any) => (
                    <div key={contact.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {contact.first_name} {contact.last_name}
                        </div>
                        <div className="text-sm text-gray-600">{contact.email}</div>
                        {contact.company && (
                          <div className="text-xs text-gray-500">{contact.company}</div>
                        )}
                        <div className="text-xs text-yellow-700 mt-1">
                          Current: {contact.industry}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedContact(contact);
                          setNewIndustry('');
                          setCustomIndustry('');
                          setShowIndustryModal(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                      >
                        Update Industry
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}


      </div>

      {/* Industry Update Modal */}
      {showIndustryModal && selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Update Industry
            </h2>
            
            {/* Contact Info */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="font-semibold text-gray-900">
                {selectedContact.first_name} {selectedContact.last_name}
              </div>
              <div className="text-sm text-gray-600">{selectedContact.email}</div>
              {selectedContact.company && (
                <div className="text-xs text-gray-500">{selectedContact.company}</div>
              )}
              {selectedContact.industry && (
                <div className="text-xs text-yellow-700 mt-1">
                  Current: {selectedContact.industry}
                </div>
              )}
            </div>

            {availableIndustries.length > 0 ? (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  💡 Select from {availableIndustries.length} industries that match your journalist leads
                </p>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-xs text-orange-800">
                  ⚠️ No journalist leads with industries found
                </p>
              </div>
            )}

            {/* Industry Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Industry:
              </label>
              <select
                value={newIndustry}
                onChange={(e) => {
                  setNewIndustry(e.target.value);
                  if (e.target.value !== 'Other') {
                    setCustomIndustry('');
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- Select Industry --</option>
                {availableIndustries.length > 0 ? (
                  <>
                    {availableIndustries.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                    <option value="Other">Other (type custom)</option>
                  </>
                ) : (
                  <option value="Other">Other (type custom)</option>
                )}
              </select>
            </div>

            {/* Custom Industry Input */}
            {newIndustry === 'Other' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Custom Industry:
                </label>
                <input
                  type="text"
                  value={customIndustry}
                  onChange={(e) => setCustomIndustry(e.target.value)}
                  placeholder="e.g., Biotechnology"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-orange-600 mt-1">
                  ⚠️ Custom industries may not match journalist leads
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const industryToSave = newIndustry === 'Other' ? customIndustry : newIndustry;
                  if (industryToSave && industryToSave.trim() !== '') {
                    handleUpdateIndustry(selectedContact.id, industryToSave.trim());
                  } else {
                    alert('Please select an industry or enter a custom one');
                  }
                }}
                disabled={!newIndustry || (newIndustry === 'Other' && !customIndustry.trim())}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Save Industry
              </button>
              <button
                onClick={() => {
                  setShowIndustryModal(false);
                  setSelectedContact(null);
                  setNewIndustry('');
                  setCustomIndustry('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
