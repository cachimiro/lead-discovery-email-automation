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
  notes?: string;
  created_at: string;
}

interface Pool {
  pool_id: string;
  pool_name: string;
  description: string;
  color: string;
  contact_count: number;
}

export default function PoolDetailPage() {
  const router = useRouter();
  const params = useParams();
  const poolId = params.id as string;
  
  const [pool, setPool] = useState<Pool | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    fetchPoolDetails();
    fetchContacts();
  }, [poolId]);

  const fetchPoolDetails = async () => {
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
      console.log('Fetching contacts for pool:', poolId);
      const response = await fetch(`/api/lead-pools/${poolId}/contacts`);
      const data = await response.json();
      console.log('Pool contacts response:', data);
      if (data.success) {
        setContacts(data.contacts);
        console.log('Set contacts:', data.contacts?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === contacts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(contacts.map(c => c.id));
    }
  };

  const handleRemoveFromPool = async () => {
    if (selectedIds.length === 0) return;
    
    if (!confirm(`Remove ${selectedIds.length} contact(s) from this pool?`)) {
      return;
    }

    setRemoving(true);
    try {
      const response = await fetch(`/api/lead-pools/${poolId}/contacts`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactIds: selectedIds })
      });

      const data = await response.json();

      if (data.success) {
        setContacts(contacts.filter(c => !selectedIds.includes(c.id)));
        setSelectedIds([]);
        // Refresh pool details to update count
        fetchPoolDetails();
      } else {
        alert(data.error || 'Failed to remove contacts');
      }
    } catch (error) {
      console.error('Error removing contacts:', error);
      alert('Failed to remove contacts');
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Pool not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/lead-pools')}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
          >
            ← Back to Pools
          </button>
          
          <div className="flex items-center gap-4">
            <div
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: pool.color }}
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{pool.pool_name}</h1>
              {pool.description && (
                <p className="mt-2 text-gray-600">{pool.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Stats & Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {contacts.length}
              </div>
              <div className="text-sm text-gray-600">
                {contacts.length === 1 ? 'contact' : 'contacts'} in this pool
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/lead-pools/${poolId}/add-contacts`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                + Add Contacts
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        {selectedIds.length > 0 && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg px-6 py-3 flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedIds.length} contact(s) selected
            </span>
            <button
              onClick={handleRemoveFromPool}
              disabled={removing}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {removing ? 'Removing...' : `Remove ${selectedIds.length} from Pool`}
            </button>
          </div>
        )}

        {/* Contacts List */}
        {contacts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No contacts in this pool</h3>
            <p className="text-gray-600 mb-6">
              Get started by adding contacts to this pool
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                onClick={() => router.push(`/lead-pools/${poolId}/add-contacts`)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors w-full sm:w-auto"
              >
                📋 Browse & Select Contacts
              </button>
              <button
                onClick={() => router.push('/contacts')}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors w-full sm:w-auto"
              >
                + Create New Contact
              </button>
              <button
                onClick={() => router.push('/discover')}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors w-full sm:w-auto"
              >
                🔍 Discover Leads
              </button>
            </div>
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              <p className="font-semibold mb-2">💡 Quick Tips:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Browse & Select:</strong> Choose from existing contacts or discovered leads</li>
                <li><strong>Create New:</strong> Add a contact manually to your database</li>
                <li><strong>Discover Leads:</strong> Find new potential contacts using lead discovery</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900 w-12">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === contacts.length && contacts.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Name</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Email</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Company</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Title</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50">
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
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(contact.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
