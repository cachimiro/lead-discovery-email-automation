'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface Contact {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  title?: string;
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
}

interface Pool {
  id: string;
  name: string;
  color: string;
}

export default function AddContactsToPoolPage() {
  const router = useRouter();
  const params = useParams();
  const poolId = params.id as string;
  
  const [pool, setPool] = useState<Pool | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [discoveredLeads, setDiscoveredLeads] = useState<DiscoveredLead[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'contacts' | 'discovered'>('contacts');
  const [newContact, setNewContact] = useState({
    email: '',
    first_name: '',
    last_name: '',
    company: '',
    title: ''
  });
  const [creating, setCreating] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchPool();
    fetchContacts();
    fetchDiscoveredLeads();
  }, [poolId]);

  const fetchPool = async () => {
    try {
      const response = await fetch(`/api/lead-pools/${poolId}`);
      const data = await response.json();
      if (data.success) {
        setPool(data.pool);
      }
    } catch (error) {
      console.error('Error fetching pool:', error);
    }
  };

  const fetchContacts = async () => {
    try {
      console.log('Fetching contacts...');
      const response = await fetch('/api/contacts');
      const data = await response.json();
      console.log('Contacts response:', data);
      if (data.success) {
        console.log('Setting contacts:', data.contacts?.length || 0);
        setContacts(data.contacts || []);
      } else {
        console.error('Failed to fetch contacts:', data.error);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscoveredLeads = async () => {
    try {
      const response = await fetch('/api/discovered-leads/ai');
      const data = await response.json();
      console.log('Discovered leads response:', data);
      if (data.success) {
        // Log first lead to see structure
        if (data.leads && data.leads.length > 0) {
          console.log('First discovered lead structure:', data.leads[0]);
        }
        setDiscoveredLeads(data.leads || []);
        console.log('Set discovered leads:', data.leads?.length || 0);
      } else {
        console.error('Failed to fetch discovered leads:', data.error);
      }
    } catch (error) {
      console.error('Error fetching discovered leads:', error);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === currentList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentList.map(c => c.id));
    }
  };

  const handleAddToPool = async () => {
    console.log('handleAddToPool called', { activeTab, selectedIds, selectedCount: selectedIds.length });
    
    if (selectedIds.length === 0) {
      alert('Please select at least one contact');
      return;
    }

    setAdding(true);
    try {
      let contactIdsToAdd = selectedIds;

      // If adding discovered leads, convert them to contacts first
      if (activeTab === 'discovered') {
        const selectedLeads = discoveredLeads.filter(lead => selectedIds.includes(lead.id));
        console.log('Selected leads to convert:', selectedLeads);
        
        const convertedIds: string[] = [];
        const errors: string[] = [];

        for (const lead of selectedLeads) {
          // Skip leads without email
          if (!lead.email) {
            errors.push(`Lead without email skipped`);
            console.warn('Lead without email:', lead);
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

          const contactData = {
            email: lead.email,
            first_name: firstName || undefined,
            last_name: lastName || undefined,
            company: lead.company_name || undefined,
            title: title || undefined
          };

          console.log('Creating contact with data:', contactData);

          // Create contact from discovered lead
          try {
            const createResponse = await fetch('/api/contacts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(contactData)
            });

            const createData = await createResponse.json();
            console.log('Create contact response:', createData);
            
            if (createData.success && createData.contact) {
              convertedIds.push(createData.contact.id);
            } else {
              errors.push(`Failed to create contact for ${lead.email}: ${createData.error || 'Unknown error'}`);
            }
          } catch (err) {
            console.error('Error creating contact:', err);
            errors.push(`Error creating contact for ${lead.email}`);
          }
        }

        console.log('Conversion complete:', { convertedIds, errors });

        if (convertedIds.length === 0) {
          alert(`Failed to convert any leads to contacts.\n${errors.join('\n')}`);
          setAdding(false);
          return;
        }

        if (errors.length > 0) {
          console.warn('Some leads failed to convert:', errors);
        }

        contactIdsToAdd = convertedIds;
      }

      if (contactIdsToAdd.length === 0) {
        alert('No valid contacts to add');
        setAdding(false);
        return;
      }

      // Add contacts to pool
      console.log('Adding contacts to pool:', { poolId, contactIdsToAdd });
      const response = await fetch(`/api/lead-pools/${poolId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactIds: contactIdsToAdd })
      });

      const data = await response.json();
      console.log('Add to pool response:', data);

      if (data.success) {
        setSuccessMessage(`✅ Successfully added ${data.added} ${activeTab === 'contacts' ? 'contact(s)' : 'lead(s)'} to pool!`);
        setShowSuccessToast(true);
        
        // Redirect after showing success message
        setTimeout(() => {
          router.push(`/lead-pools/${poolId}`);
        }, 1500);
      } else {
        alert(data.error || 'Failed to add to pool');
      }
    } catch (error) {
      console.error('Error adding to pool:', error);
      alert('Failed to add to pool');
    } finally {
      setAdding(false);
    }
  };

  const handleCreateContact = async () => {
    if (!newContact.email || !newContact.first_name || !newContact.last_name) {
      alert('Please fill in email, first name, and last name');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact)
      });

      const data = await response.json();

      if (data.success) {
        // Add new contact to list and select it
        const createdContact = data.contact;
        setContacts([createdContact, ...contacts]);
        setSelectedIds([...selectedIds, createdContact.id]);
        
        // Reset form
        setNewContact({
          email: '',
          first_name: '',
          last_name: '',
          company: '',
          title: ''
        });
        setShowCreateForm(false);
        
        setSuccessMessage('✅ Contact created and selected!');
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
      } else {
        alert(data.error || 'Failed to create contact');
      }
    } catch (error) {
      console.error('Error creating contact:', error);
      alert('Failed to create contact');
    } finally {
      setCreating(false);
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const search = searchTerm.toLowerCase();
    return (
      contact.email.toLowerCase().includes(search) ||
      contact.first_name?.toLowerCase().includes(search) ||
      contact.last_name?.toLowerCase().includes(search) ||
      contact.company?.toLowerCase().includes(search)
    );
  });

  const filteredDiscoveredLeads = discoveredLeads.filter(lead => {
    const search = searchTerm.toLowerCase();
    const firstName = lead.first_name || lead.contact_first_name || '';
    const lastName = lead.last_name || lead.contact_last_name || '';
    const title = lead.title || lead.contact_title || '';
    return (
      lead.email?.toLowerCase().includes(search) ||
      firstName.toLowerCase().includes(search) ||
      lastName.toLowerCase().includes(search) ||
      lead.full_name?.toLowerCase().includes(search) ||
      lead.company_name?.toLowerCase().includes(search) ||
      title.toLowerCase().includes(search)
    );
  });

  const currentList = activeTab === 'contacts' ? filteredContacts : filteredDiscoveredLeads;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Success Toast */}
      {showSuccessToast && (
        <div 
          className="fixed top-4 right-4 z-50 transition-all duration-300 ease-out"
          style={{
            animation: 'slideIn 0.3s ease-out'
          }}
        >
          <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <span className="font-medium">{successMessage}</span>
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `
      }} />

      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/lead-pools/${poolId}`)}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
          >
            ← Back to Pool
          </button>
          
          {pool && (
            <div className="flex items-center gap-4">
              <div
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: pool.color }}
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Add Contacts to {pool.name}
                </h1>
                <p className="mt-2 text-gray-600">
                  Select from existing contacts or discovered leads
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => {
                setActiveTab('contacts');
                setSelectedIds([]);
                setShowCreateForm(false);
              }}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'contacts'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Contacts ({contacts.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('discovered');
                setSelectedIds([]);
                setShowCreateForm(false);
              }}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'discovered'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Discovered Leads ({discoveredLeads.length})
            </button>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder={`Search ${activeTab === 'contacts' ? 'contacts' : 'discovered leads'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {activeTab === 'contacts' && (
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                {showCreateForm ? 'Cancel' : '+ Create New Contact'}
              </button>
            )}
          </div>
        </div>

        {/* Create Contact Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Contact</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={newContact.first_name}
                  onChange={(e) => setNewContact({ ...newContact, first_name: e.target.value })}
                  placeholder="John"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={newContact.last_name}
                  onChange={(e) => setNewContact({ ...newContact, last_name: e.target.value })}
                  placeholder="Doe"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  value={newContact.company}
                  onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                  placeholder="Acme Corp"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={newContact.title}
                  onChange={(e) => setNewContact({ ...newContact, title: e.target.value })}
                  placeholder="CEO"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleCreateContact}
                disabled={creating}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 transition-colors"
              >
                {creating ? 'Creating...' : 'Create & Select Contact'}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Selection Summary */}
        {selectedIds.length > 0 && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg px-6 py-3 flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedIds.length} contact(s) selected
            </span>
            <button
              onClick={handleAddToPool}
              disabled={adding}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
            >
              {adding ? 'Adding...' : `Add ${selectedIds.length} to Pool`}
            </button>
          </div>
        )}

        {/* List */}
        {currentList.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No {activeTab === 'contacts' ? 'contacts' : 'discovered leads'} found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Try a different search term' : `No ${activeTab === 'contacts' ? 'contacts' : 'discovered leads'} available`}
            </p>
            {!searchTerm && activeTab === 'contacts' && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                + Create First Contact
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900 w-12">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === currentList.length && currentList.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Name</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Email</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Company</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Title</th>
                  {activeTab === 'discovered' && (
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Source</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {activeTab === 'contacts' ? (
                  filteredContacts.map((contact) => (
                    <tr 
                      key={contact.id} 
                      className={`hover:bg-gray-50 cursor-pointer ${
                        selectedIds.includes(contact.id) ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => toggleSelect(contact.id)}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(contact.id)}
                          onChange={() => toggleSelect(contact.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {contact.first_name || contact.last_name
                          ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{contact.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{contact.company || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{contact.title || '-'}</td>
                    </tr>
                  ))
                ) : (
                  filteredDiscoveredLeads.map((lead) => {
                    const firstName = lead.first_name || lead.contact_first_name || '';
                    const lastName = lead.last_name || lead.contact_last_name || '';
                    const fullName = lead.full_name || `${firstName} ${lastName}`.trim();
                    const title = lead.title || lead.contact_title || '';
                    
                    return (
                      <tr 
                        key={lead.id} 
                        className={`hover:bg-gray-50 cursor-pointer ${
                          selectedIds.includes(lead.id) ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => toggleSelect(lead.id)}
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(lead.id)}
                            onChange={() => toggleSelect(lead.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {fullName || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{lead.email || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{lead.company_name || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{title || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 text-xs">{lead.source}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
