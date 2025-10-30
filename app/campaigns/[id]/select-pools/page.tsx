'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface LeadPool {
  id: string;
  name: string;
  description: string;
  color: string;
  contact_count: number;
}

interface DiscoveredLead {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  company_name?: string;
  company_domain?: string;
  title?: string;
  source: string;
  contact_first_name?: string;
  contact_last_name?: string;
  contact_title?: string;
  isValid: boolean;
}

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'E-commerce',
  'Education',
  'Manufacturing',
  'Real Estate',
  'Marketing',
  'Consulting',
  'Retail',
  'Food & Beverage',
  'Travel & Hospitality',
  'Media & Entertainment',
  'Automotive',
  'Energy',
  'Telecommunications',
  'Legal',
  'Non-profit',
  'Other'
];

export default function SelectPoolsPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;
  
  const [pools, setPools] = useState<LeadPool[]>([]);
  const [selectedPoolIds, setSelectedPoolIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickAddPoolId, setQuickAddPoolId] = useState<string | null>(null);
  const [quickAddTab, setQuickAddTab] = useState<'create' | 'select'>('select');
  const [quickAddContact, setQuickAddContact] = useState({
    email: '',
    first_name: '',
    last_name: '',
    company: '',
    title: ''
  });
  const [addingContact, setAddingContact] = useState(false);
  const [allContacts, setAllContacts] = useState<any[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [contactSearchTerm, setContactSearchTerm] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(false);

  const [showDiscoveredLeadsModal, setShowDiscoveredLeadsModal] = useState(false);
  const [discoveredLeadsPoolId, setDiscoveredLeadsPoolId] = useState<string | null>(null);
  const [discoveredLeads, setDiscoveredLeads] = useState<DiscoveredLead[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [importingLeads, setImportingLeads] = useState(false);
  const [showIndustryModal, setShowIndustryModal] = useState(false);
  const [leadsNeedingIndustry, setLeadsNeedingIndustry] = useState<DiscoveredLead[]>([]);
  const [industrySelections, setIndustrySelections] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPools();
  }, []);

  const fetchPools = async () => {
    try {
      const response = await fetch('/api/lead-pools');
      const data = await response.json();
      if (data.success) {
        setPools(data.pools);
      }
    } catch (error) {
      console.error('Error fetching pools:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePool = (poolId: string) => {
    setSelectedPoolIds(prev =>
      prev.includes(poolId)
        ? prev.filter(id => id !== poolId)
        : [...prev, poolId]
    );
  };

  const handleContinue = async () => {
    if (selectedPoolIds.length === 0) {
      alert('Please select at least one pool');
      return;
    }

    setSaving(true);
    try {
      // Save pool selection to campaign
      const response = await fetch(`/api/campaigns/${campaignId}/pools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poolIds: selectedPoolIds })
      });

      const data = await response.json();

      if (data.success) {
        // Continue to preview with selected pools
        router.push(`/campaigns/${campaignId}/preview?pools=${selectedPoolIds.join(',')}`);
      } else {
        alert(data.error || 'Failed to save pool selection');
        setSaving(false);
      }
    } catch (error) {
      console.error('Error saving pool selection:', error);
      alert('Failed to save pool selection');
      setSaving(false);
    }
  };

  const handleSkip = () => {
    // Skip pool selection and use all contacts
    router.push(`/campaigns/${campaignId}/preview`);
  };

  const openQuickAdd = async (poolId: string) => {
    setQuickAddPoolId(poolId);
    setShowQuickAddModal(true);
    setLoadingContacts(true);
    
    // Fetch all contacts
    try {
      const response = await fetch('/api/contacts');
      const data = await response.json();
      if (data.success) {
        setAllContacts(data.contacts || []);
        // Default to 'select' tab if there are contacts, otherwise 'create'
        setQuickAddTab(data.contacts && data.contacts.length > 0 ? 'select' : 'create');
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoadingContacts(false);
    }
  };

  const openDiscoveredLeads = async (poolId: string) => {
    setDiscoveredLeadsPoolId(poolId);
    setShowDiscoveredLeadsModal(true);
    setLoadingLeads(true);
    
    try {
      const response = await fetch('/api/discovered-leads/ai');
      const data = await response.json();
      
      if (data.success) {
        setDiscoveredLeads(data.leads || []);
      } else {
        alert('Failed to load discovered leads');
      }
    } catch (error) {
      console.error('Error loading discovered leads:', error);
      alert('Failed to load discovered leads');
    } finally {
      setLoadingLeads(false);
    }
  };

  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeadIds(prev =>
      prev.includes(leadId)
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const toggleSelectAllLeads = () => {
    if (selectedLeadIds.length === discoveredLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(discoveredLeads.map(lead => lead.id));
    }
  };

  const handleConfirmIndustries = async () => {
    // Check all industries are filled
    const missingIndustries = leadsNeedingIndustry.filter(lead => !industrySelections[lead.id] || industrySelections[lead.id].trim() === '');
    
    if (missingIndustries.length > 0) {
      alert(`Please select industry for all ${missingIndustries.length} lead(s)`);
      return;
    }

    setShowIndustryModal(false);
    
    // Get all selected leads and proceed with import
    const selectedLeads = discoveredLeads.filter(lead => selectedLeadIds.includes(lead.id));
    await performImport(selectedLeads);
  };


  const handleImportDiscoveredLeads = async () => {
    if (selectedLeadIds.length === 0) {
      alert('Please select at least one lead');
      return;
    }

    if (!discoveredLeadsPoolId) return;

    const selectedLeads = discoveredLeads.filter(lead => selectedLeadIds.includes(lead.id));
    
    // Check for leads without industry
    const leadsWithoutIndustry = selectedLeads.filter(lead => {
      const industry = (lead as any).industry || (lead as any).journalist_industry;
      return !industry || industry.trim() === '';
    });

    if (leadsWithoutIndustry.length > 0) {
      // Show industry selection modal
      setLeadsNeedingIndustry(leadsWithoutIndustry);
      const initialSelections: Record<string, string> = {};
      leadsWithoutIndustry.forEach(lead => {
        initialSelections[lead.id] = '';
      });
      setIndustrySelections(initialSelections);
      setShowIndustryModal(true);
      return;
    }

    // Proceed with import
    await performImport(selectedLeads);
  };

  const performImport = async (leadsToImport: DiscoveredLead[]) => {
    setImportingLeads(true);
    try {
      const contactIds: string[] = [];
      let errors = 0;
      let duplicates = 0;

      for (const lead of leadsToImport) {
        if (!lead.email) {
          errors++;
          continue;
        }

        let firstName = lead.first_name || lead.contact_first_name || '';
        let lastName = lead.last_name || lead.contact_last_name || '';
        
        // If no first/last name but we have full_name, split it
        if (!firstName && !lastName && lead.full_name) {
          const nameParts = lead.full_name.trim().split(' ');
          if (nameParts.length > 0) {
            firstName = nameParts[0];
            lastName = nameParts.slice(1).join(' ');
          }
        }
        
        const title = lead.title || lead.contact_title || '';
        const industry = industrySelections[lead.id] || (lead as any).industry || (lead as any).journalist_industry || undefined;

        const contactData = {
          email: lead.email,
          first_name: firstName || undefined,
          last_name: lastName || undefined,
          company: lead.company_name || undefined,
          title: title || undefined,
          industry: industry
        };

        // Try to create contact, or find existing one
        try {
          const createResponse = await fetch('/api/contacts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contactData)
          });

          const createData = await createResponse.json();
          
          if (createData.success && createData.contact) {
            contactIds.push(createData.contact.id);
          } else if (createData.error && createData.error.includes('already exists')) {
            // Contact exists, find it by email
            duplicates++;
            try {
              const findResponse = await fetch('/api/contacts');
              const findData = await findResponse.json();
              if (findData.success) {
                const existingContact = findData.contacts.find((c: any) => c.email === lead.email);
                if (existingContact) {
                  contactIds.push(existingContact.id);
                } else {
                  errors++;
                }
              } else {
                errors++;
              }
            } catch {
              errors++;
            }
          } else {
            errors++;
          }
        } catch (err) {
          console.error('Error creating contact:', err);
          errors++;
        }
      }

      if (contactIds.length === 0) {
        alert('No contacts were imported. Please check the lead data.');
        setImportingLeads(false);
        return;
      }

      // Add contacts to pool
      const addResponse = await fetch(`/api/lead-pools/${discoveredLeadsPoolId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactIds })
      });

      const addData = await addResponse.json();

      if (addData.success) {
        setSelectedLeadIds([]);
        setShowDiscoveredLeadsModal(false);
        setDiscoveredLeadsPoolId(null);
        fetchPools();
        
        let message = `✅ Successfully imported ${contactIds.length} lead(s) as contacts!`;
        if (duplicates > 0) message += `\n📋 ${duplicates} existing contact(s) added to pool.`;
        if (errors > 0) message += `\n❌ ${errors} failed.`;
        alert(message);
      } else {
        alert(addData.error || 'Failed to add contacts to pool');
      }
    } catch (error) {
      console.error('Error importing discovered leads:', error);
      alert('Failed to import leads');
    } finally {
      setImportingLeads(false);
    }
  };

  const handleAddSelectedContacts = async () => {
    if (selectedContactIds.length === 0) {
      alert('Please select at least one contact');
      return;
    }

    if (!quickAddPoolId) return;

    setAddingContact(true);
    try {
      // Add contacts to pool
      const addResponse = await fetch(`/api/lead-pools/${quickAddPoolId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactIds: selectedContactIds })
      });

      const addData = await addResponse.json();

      if (addData.success) {
        setSelectedContactIds([]);
        setShowQuickAddModal(false);
        setQuickAddPoolId(null);
        fetchPools();
        
        alert(`✅ Successfully added ${addData.added} contact(s) to pool!`);
      } else {
        alert(addData.error || 'Failed to add contacts to pool');
      }
    } catch (error) {
      console.error('Error adding contacts:', error);
      alert('Failed to add contacts');
    } finally {
      setAddingContact(false);
    }
  };

  const handleQuickAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!quickAddContact.email || !quickAddContact.first_name || !quickAddContact.last_name) {
      alert('Please fill in email, first name, and last name');
      return;
    }

    if (!quickAddPoolId) return;

    setAddingContact(true);
    try {
      // Create contact
      const createResponse = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quickAddContact)
      });

      const createData = await createResponse.json();

      if (!createData.success) {
        alert(createData.error || 'Failed to create contact');
        setAddingContact(false);
        return;
      }

      // Add contact to pool
      const addResponse = await fetch(`/api/lead-pools/${quickAddPoolId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactIds: [createData.contact.id] })
      });

      const addData = await addResponse.json();

      if (addData.success) {
        // Reset form
        setQuickAddContact({
          email: '',
          first_name: '',
          last_name: '',
          company: '',
          title: ''
        });
        setShowQuickAddModal(false);
        setQuickAddPoolId(null);
        
        // Refresh pools
        fetchPools();
        
        alert('✅ Contact added successfully!');
      } else {
        alert(addData.error || 'Failed to add contact to pool');
      }
    } catch (error) {
      console.error('Error adding contact:', error);
      alert('Failed to add contact');
    } finally {
      setAddingContact(false);
    }
  };

  const totalContacts = selectedPoolIds.reduce((sum, poolId) => {
    const pool = pools.find(p => p.id === poolId);
    return sum + (pool?.contact_count || 0);
  }, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading pools...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Select Lead Pools</h1>
          <p className="mt-2 text-gray-600">
            Choose which pools to include in this campaign
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={() => router.push('/lead-pools')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <span>+</span> Create New Pool
          </button>
          <button
            onClick={() => router.push('/contacts')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <span>+</span> Add Contacts
          </button>
          <button
            onClick={() => fetchPools()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Pools
          </button>
        </div>

        {/* Info Box */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Select one or more pools to target specific groups of contacts. 
            You can also skip this step to use all your contacts.
          </p>
        </div>

        {/* Pools Selection */}
        {pools.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No pools available</h3>
            <p className="text-gray-600 mb-6">
              You haven't created any lead pools yet. You can create pools to organize your contacts,
              or skip this step to use all contacts.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push('/lead-pools')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Create Pools
              </button>
              <button
                onClick={handleSkip}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Skip & Use All Contacts
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {pools.map((pool) => {
                const isSelected = selectedPoolIds.includes(pool.id);
                return (
                  <div
                    key={pool.id}
                    onClick={() => togglePool(pool.id)}
                    className={`p-6 rounded-lg border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: pool.color }}
                        />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {pool.name}
                        </h3>
                      </div>
                      {isSelected && (
                        <div className="text-blue-600">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {pool.description && (
                      <p className="text-sm text-gray-600 mb-3">
                        {pool.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-2xl font-bold text-gray-900">
                          {pool.contact_count}
                        </div>
                        <div className="text-sm text-gray-600">
                          {pool.contact_count === 1 ? 'contact' : 'contacts'}
                        </div>
                      </div>
                      {pool.contact_count === 0 && (
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openQuickAdd(pool.id)}
                            className="px-2 py-1 bg-blue-600 text-white text-xs rounded font-medium hover:bg-blue-700 transition-colors"
                            title="Add one contact"
                          >
                            + Add
                          </button>
                          <button
                            onClick={() => openDiscoveredLeads(pool.id)}
                            className="px-2 py-1 bg-purple-600 text-white text-xs rounded font-medium hover:bg-purple-700 transition-colors"
                            title="Import from discovered leads"
                          >
                            🔍 Leads
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selection Summary */}
            {selectedPoolIds.length > 0 && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✅ <strong>{selectedPoolIds.length}</strong> pool(s) selected with{' '}
                  <strong>{totalContacts}</strong> total contact(s)
                </p>
              </div>
            )}
          </>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/campaigns/new')}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            ← Back
          </button>

          <div className="flex gap-3">
            {pools.length > 0 && (
              <button
                onClick={handleSkip}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Skip & Use All Contacts
              </button>
            )}
            <button
              onClick={handleContinue}
              disabled={selectedPoolIds.length === 0 || saving}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Continue to Preview →'}
            </button>
          </div>
        </div>

        {/* Quick Add Contact Modal */}
        {showQuickAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Contacts to Pool</h2>
              
              {/* Tabs */}
              <div className="flex border-b border-gray-200 mb-4">
                <button
                  onClick={() => setQuickAddTab('select')}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    quickAddTab === 'select'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Select Existing ({allContacts.length})
                </button>
                <button
                  onClick={() => setQuickAddTab('create')}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    quickAddTab === 'create'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Create New
                </button>
              </div>

              {/* Select Existing Tab */}
              {quickAddTab === 'select' && (
                <div>
                  {loadingContacts ? (
                    <div className="text-center py-8 text-gray-600">Loading contacts...</div>
                  ) : allContacts.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600 mb-4">No contacts available</p>
                      <button
                        onClick={() => setQuickAddTab('create')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                      >
                        Create Your First Contact
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder="Search contacts..."
                        value={contactSearchTerm}
                        onChange={(e) => setContactSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      
                      <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                        {allContacts
                          .filter(contact => {
                            const search = contactSearchTerm.toLowerCase();
                            return (
                              contact.email?.toLowerCase().includes(search) ||
                              contact.first_name?.toLowerCase().includes(search) ||
                              contact.last_name?.toLowerCase().includes(search) ||
                              contact.company?.toLowerCase().includes(search)
                            );
                          })
                          .map(contact => (
                            <div
                              key={contact.id}
                              onClick={() => {
                                setSelectedContactIds(prev =>
                                  prev.includes(contact.id)
                                    ? prev.filter(id => id !== contact.id)
                                    : [...prev, contact.id]
                                );
                              }}
                              className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                                selectedContactIds.includes(contact.id) ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={selectedContactIds.includes(contact.id)}
                                  onChange={() => {}}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">
                                    {contact.first_name} {contact.last_name}
                                  </div>
                                  <div className="text-sm text-gray-600">{contact.email}</div>
                                  {contact.company && (
                                    <div className="text-sm text-gray-500">{contact.company}</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>

                      {selectedContactIds.length > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                          ✅ {selectedContactIds.length} contact(s) selected
                        </div>
                      )}

                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() => {
                            setShowQuickAddModal(false);
                            setQuickAddPoolId(null);
                            setSelectedContactIds([]);
                            setContactSearchTerm('');
                          }}
                          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddSelectedContacts}
                          disabled={selectedContactIds.length === 0 || addingContact}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                          {addingContact ? 'Adding...' : `Add ${selectedContactIds.length} Contact(s)`}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Create New Tab */}
              {quickAddTab === 'create' && (
                <form onSubmit={handleQuickAddContact} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={quickAddContact.email}
                      onChange={(e) => setQuickAddContact({ ...quickAddContact, email: e.target.value })}
                      placeholder="john@example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={quickAddContact.first_name}
                        onChange={(e) => setQuickAddContact({ ...quickAddContact, first_name: e.target.value })}
                        placeholder="John"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={quickAddContact.last_name}
                        onChange={(e) => setQuickAddContact({ ...quickAddContact, last_name: e.target.value })}
                        placeholder="Doe"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company
                    </label>
                    <input
                      type="text"
                      value={quickAddContact.company}
                      onChange={(e) => setQuickAddContact({ ...quickAddContact, company: e.target.value })}
                      placeholder="Acme Corp"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={quickAddContact.title}
                      onChange={(e) => setQuickAddContact({ ...quickAddContact, title: e.target.value })}
                      placeholder="CEO"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowQuickAddModal(false);
                        setQuickAddPoolId(null);
                        setQuickAddContact({
                          email: '',
                          first_name: '',
                          last_name: '',
                          company: '',
                          title: ''
                        });
                      }}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addingContact}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {addingContact ? 'Adding...' : 'Create & Add Contact'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Discovered Leads Import Modal */}
        {showDiscoveredLeadsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Import from Discovered Leads</h2>
                <button
                  onClick={() => {
                    setShowDiscoveredLeadsModal(false);
                    setDiscoveredLeadsPoolId(null);
                    setSelectedLeadIds([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {loadingLeads ? (
                <div className="text-center py-12">
                  <div className="text-gray-600">Loading discovered leads...</div>
                </div>
              ) : discoveredLeads.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Discovered Leads</h3>
                  <p className="text-gray-600 mb-6">
                    You haven't discovered any leads yet. Use the lead discovery feature to find potential contacts.
                  </p>
                  <button
                    onClick={() => router.push('/discover')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Discover Leads
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                    <p className="text-blue-800">
                      💡 Select leads to import as contacts. They will be added to the pool and converted to contacts automatically.
                    </p>
                  </div>

                  {/* Selection Summary */}
                  {selectedLeadIds.length > 0 && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        ✅ <strong>{selectedLeadIds.length}</strong> lead(s) selected
                      </p>
                    </div>
                  )}

                  {/* Leads Table */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                          <tr>
                            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">
                              <input
                                type="checkbox"
                                checked={selectedLeadIds.length === discoveredLeads.length && discoveredLeads.length > 0}
                                onChange={toggleSelectAllLeads}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Name</th>
                            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Email</th>
                            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Company</th>
                            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Title</th>
                            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Source</th>
                            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {discoveredLeads.map((lead) => {
                            const firstName = lead.first_name || lead.contact_first_name || '';
                            const lastName = lead.last_name || lead.contact_last_name || '';
                            const fullName = lead.full_name || `${firstName} ${lastName}`.trim();
                            const title = lead.title || lead.contact_title || '';
                            
                            return (
                              <tr key={lead.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedLeadIds.includes(lead.id)}
                                    onChange={() => toggleLeadSelection(lead.id)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                </td>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                  {fullName || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">{lead.email || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{lead.company_name || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{title || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-500 capitalize">{lead.source}</td>
                                <td className="px-4 py-3 text-sm">
                                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                    lead.isValid 
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-red-100 text-red-700'
                                  }`}>
                                    {lead.isValid ? '✓ Valid' : '✗ Invalid'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowDiscoveredLeadsModal(false);
                        setDiscoveredLeadsPoolId(null);
                        setSelectedLeadIds([]);
                      }}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleImportDiscoveredLeads}
                      disabled={selectedLeadIds.length === 0 || importingLeads}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {importingLeads ? 'Importing...' : `Import ${selectedLeadIds.length} Lead(s)`}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Industry Selection Modal */}
        {showIndustryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Select Industry for Leads</h2>
              
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                <p className="text-yellow-800">
                  ⚠️ <strong>Industry Required:</strong> {leadsNeedingIndustry.length} lead(s) don't have an industry assigned. 
                  Please select an industry for each lead to continue.
                </p>
              </div>

              <div className="space-y-4 mb-6">
                {leadsNeedingIndustry.map((lead) => {
                  const firstName = lead.first_name || lead.contact_first_name || '';
                  const lastName = lead.last_name || lead.contact_last_name || '';
                  const fullName = lead.full_name || `${firstName} ${lastName}`.trim();
                  
                  return (
                    <div key={lead.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="mb-3">
                        <div className="font-semibold text-gray-900">{fullName || lead.email}</div>
                        <div className="text-sm text-gray-600">{lead.email}</div>
                        {lead.company_name && (
                          <div className="text-sm text-gray-600">{lead.company_name}</div>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Industry *
                        </label>
                        <select
                          value={industrySelections[lead.id] || ''}
                          onChange={(e) => setIndustrySelections({
                            ...industrySelections,
                            [lead.id]: e.target.value
                          })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select an industry...</option>
                          {INDUSTRIES.map(industry => (
                            <option key={industry} value={industry}>{industry}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowIndustryModal(false);
                    setLeadsNeedingIndustry([]);
                    setIndustrySelections({});
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmIndustries}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Continue Import
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
