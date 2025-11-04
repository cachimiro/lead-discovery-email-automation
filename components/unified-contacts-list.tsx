'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Contact {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  title?: string;
  industry?: string;
  categories?: string[];
  notes?: string;
  email_status?: string;
  is_valid?: boolean;
  created_at: string;
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
  decision_categories?: string[];
  contact_first_name?: string;
  contact_last_name?: string;
  contact_title?: string;
  isValid: boolean;
}

interface Props {
  contacts: Contact[];
  discoveredLeads: DiscoveredLead[];
  userId: string;
}

const CATEGORIES = [
  { value: 'ceo', label: 'CEO' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'sales', label: 'Sales' },
  { value: 'hr', label: 'HR' },
  { value: 'finance', label: 'Finance' },
  { value: 'operations', label: 'Operations' },
];

export default function UnifiedContactsList({ contacts: initialContacts, discoveredLeads: initialDiscoveredLeads, userId }: Props) {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [discoveredLeads, setDiscoveredLeads] = useState<DiscoveredLead[]>(initialDiscoveredLeads);
  const [activeTab, setActiveTab] = useState<'contacts' | 'discovered'>('contacts');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [newContact, setNewContact] = useState({
    email: '',
    first_name: '',
    last_name: '',
    company: '',
    title: '',
    industry: '',
    categories: [] as string[],
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  const toggleCategory = (category: string) => {
    setNewContact(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newContact.email || !newContact.first_name || !newContact.last_name) {
      alert('Please fill in email, first name, and last name');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact)
      });

      const data = await response.json();

      if (data.success) {
        // Optimistic update - add contact immediately to UI
        const newContactData: Contact = {
          id: data.contact.id,
          email: newContact.email,
          first_name: newContact.first_name,
          last_name: newContact.last_name,
          company: newContact.company,
          title: newContact.title,
          industry: newContact.industry,
          categories: newContact.categories,
          notes: newContact.notes,
          email_status: data.contact.email_status,
          is_valid: data.contact.is_valid,
          created_at: data.contact.created_at
        };
        setContacts(prev => [newContactData, ...prev]);
        
        setNewContact({
          email: '',
          first_name: '',
          last_name: '',
          company: '',
          title: '',
          industry: '',
          categories: [],
          notes: ''
        });
        setShowAddForm(false);
        
        // Still refresh to ensure consistency
        router.refresh();
      } else {
        alert(data.error || 'Failed to create contact');
      }
    } catch (error) {
      console.error('Error creating contact:', error);
      alert('Failed to create contact');
    } finally {
      setSaving(false);
    }
  };

  const handleEditContact = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingContact) return;

    setSaving(true);
    try {
      const response = await fetch('/api/contacts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingContact)
      });

      const data = await response.json();

      if (data.success) {
        // Optimistic update - update contact immediately in UI
        setContacts(prev => prev.map(c => 
          c.id === editingContact.id ? { ...editingContact } : c
        ));
        
        setEditingContact(null);
        
        // Still refresh to ensure consistency
        router.refresh();
      } else {
        alert(data.error || 'Failed to update contact');
      }
    } catch (error) {
      console.error('Error updating contact:', error);
      alert('Failed to update contact');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, type: 'contact' | 'lead') => {
    if (!confirm('Are you sure you want to delete this?')) return;

    try {
      // Optimistic update - remove from UI immediately
      if (type === 'contact') {
        setContacts(prev => prev.filter(c => c.id !== id));
      } else {
        setDiscoveredLeads(prev => prev.filter(l => l.id !== id));
      }
      
      const url = type === 'contact' 
        ? `/api/contacts?id=${id}`
        : `/api/discovered-leads/ai?id=${id}`;
      
      const response = await fetch(url, { method: 'DELETE' });
      const data = await response.json();

      if (data.success) {
        // Still refresh to ensure consistency
        router.refresh();
      } else {
        alert('Failed to delete');
        // Revert optimistic update on error
        router.refresh();
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete');
      // Revert optimistic update on error
      router.refresh();
    }
  };

  // Filter contacts
  const filteredContacts = contacts.filter(contact => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = 
      contact.email.toLowerCase().includes(search) ||
      contact.first_name?.toLowerCase().includes(search) ||
      contact.last_name?.toLowerCase().includes(search) ||
      contact.company?.toLowerCase().includes(search);
    
    const matchesCategory = selectedCategory === 'all' || 
      contact.categories?.includes(selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  // Filter discovered leads
  const filteredLeads = discoveredLeads.filter(lead => {
    const search = searchTerm.toLowerCase();
    const firstName = lead.first_name || lead.contact_first_name || '';
    const lastName = lead.last_name || lead.contact_last_name || '';
    
    const matchesSearch =
      lead.email?.toLowerCase().includes(search) ||
      firstName.toLowerCase().includes(search) ||
      lastName.toLowerCase().includes(search) ||
      lead.full_name?.toLowerCase().includes(search) ||
      lead.company_name?.toLowerCase().includes(search);
    
    const matchesCategory = selectedCategory === 'all' || 
      lead.decision_categories?.includes(selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  const currentList = activeTab === 'contacts' ? filteredContacts : filteredLeads;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('contacts')}
          className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
            activeTab === 'contacts'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Manual Contacts ({contacts.length})
        </button>
        <button
          onClick={() => setActiveTab('discovered')}
          className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
            activeTab === 'discovered'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Discovered Leads ({discoveredLeads.length})
        </button>
      </div>

      {/* Filters and Actions */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search by name, email, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>

          {activeTab === 'contacts' && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors whitespace-nowrap"
            >
              {showAddForm ? 'Cancel' : '+ Add Contact'}
            </button>
          )}
        </div>
      </div>

      {/* Add Contact Form */}
      {showAddForm && activeTab === 'contacts' && (
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Contact</h3>
          <form onSubmit={handleAddContact} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
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
                  value={newContact.last_name}
                  onChange={(e) => setNewContact({ ...newContact, last_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={newContact.title}
                  onChange={(e) => setNewContact({ ...newContact, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry
                </label>
                <input
                  type="text"
                  value={newContact.industry}
                  onChange={(e) => setNewContact({ ...newContact, industry: e.target.value })}
                  placeholder="e.g., Technology, Healthcare, Finance"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={newContact.notes}
                  onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categories
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => toggleCategory(cat.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      newContact.categories.includes(cat.value)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 transition-colors"
              >
                {saving ? 'Saving...' : 'Save Contact'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="p-6">
        {currentList.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No {activeTab === 'contacts' ? 'contacts' : 'discovered leads'} found
            </h3>
            <p className="text-gray-600">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Try adjusting your filters' 
                : activeTab === 'contacts'
                  ? 'Add your first contact to get started'
                  : 'Discover leads to see them here'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Name</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Email</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Company</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Industry</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Title</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Categories</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Status</th>
                  {activeTab === 'discovered' && (
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Source</th>
                  )}
                  <th className="text-right px-4 py-3 text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {activeTab === 'contacts' ? (
                  filteredContacts.map((contact) => {
                    const isValid = contact.is_valid !== false;
                    const emailStatus = contact.email_status || 'unknown';
                    
                    return (
                      <tr key={contact.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">
                          {contact.first_name} {contact.last_name}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">{contact.email}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{contact.company || '-'}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{contact.industry || '-'}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{contact.title || '-'}</td>
                        <td className="px-4 py-4 text-sm">
                          <div className="flex flex-wrap gap-1">
                            {contact.categories?.map(cat => (
                              <span
                                key={cat}
                                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                              >
                                {CATEGORIES.find(c => c.value === cat)?.label || cat}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            emailStatus === 'valid' 
                              ? 'bg-green-100 text-green-700'
                              : emailStatus === 'invalid'
                              ? 'bg-red-100 text-red-700'
                              : emailStatus === 'risky'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {emailStatus === 'valid' ? '✓ Valid' : 
                             emailStatus === 'invalid' ? '✗ Invalid' :
                             emailStatus === 'risky' ? '⚠ Risky' : 
                             '? Unknown'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setEditingContact(contact)}
                              className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(contact.id, 'contact')}
                              className="text-red-600 hover:text-red-700 font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  filteredLeads.map((lead) => {
                    const firstName = lead.first_name || lead.contact_first_name || '';
                    const lastName = lead.last_name || lead.contact_last_name || '';
                    const fullName = lead.full_name || `${firstName} ${lastName}`.trim();
                    const title = lead.title || lead.contact_title || '';
                    const isValid = lead.isValid;
                    
                    return (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">
                          {fullName || '-'}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">{lead.email || '-'}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{lead.company_name || '-'}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {(lead as any).industry || '-'}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">{title || '-'}</td>
                        <td className="px-4 py-4 text-sm">
                          <div className="flex flex-wrap gap-1">
                            {lead.decision_categories?.map(cat => (
                              <span
                                key={cat}
                                className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                              >
                                {CATEGORIES.find(c => c.value === cat)?.label || cat}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            isValid 
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {isValid ? '✓ Valid' : '✗ Invalid'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500 capitalize">{lead.source}</td>
                        <td className="px-4 py-4 text-sm text-right">
                          <button
                            onClick={() => handleDelete(lead.id, 'lead')}
                            className="text-red-600 hover:text-red-700 font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Contact Modal */}
      {editingContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Edit Contact</h2>
            <form onSubmit={handleEditContact} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={editingContact.email}
                    onChange={(e) => setEditingContact({ ...editingContact, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={editingContact.first_name || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, first_name: e.target.value })}
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
                    value={editingContact.last_name || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, last_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    value={editingContact.company || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, company: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editingContact.title || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={editingContact.industry || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, industry: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={editingContact.notes || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categories
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => {
                        const categories = editingContact.categories || [];
                        setEditingContact({
                          ...editingContact,
                          categories: categories.includes(cat.value)
                            ? categories.filter(c => c !== cat.value)
                            : [...categories, cat.value]
                        });
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        editingContact.categories?.includes(cat.value)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingContact(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
