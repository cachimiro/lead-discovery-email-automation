'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  title?: string;
}

export default function SelectLeadsPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;

  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/contacts');
      const data = await response.json();
      
      // Filter out leads with missing required data
      const validLeads = (data || []).filter((lead: Lead) => {
        return lead.email && 
               lead.first_name && 
               lead.last_name && 
               lead.company;
      });
      
      setLeads(validLeads);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLead = (leadId: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
    setSelectAll(newSelected.size === filteredLeads.length);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedLeads(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(filteredLeads.map(lead => lead.id));
      setSelectedLeads(allIds);
      setSelectAll(true);
    }
  };

  const handleContinue = async () => {
    if (selectedLeads.size === 0) {
      alert('Please select at least one lead');
      return;
    }

    try {
      // Save selected leads to campaign
      const response = await fetch(`/api/campaigns/${campaignId}/add-leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadIds: Array.from(selectedLeads)
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Go to preview
        router.push(`/campaigns/${campaignId}/preview`);
      }
    } catch (error) {
      console.error('Error adding leads:', error);
      alert('Failed to add leads to campaign');
    }
  };

  const filteredLeads = leads.filter(lead => {
    const search = searchTerm.toLowerCase();
    return (
      lead.first_name?.toLowerCase().includes(search) ||
      lead.last_name?.toLowerCase().includes(search) ||
      lead.email?.toLowerCase().includes(search) ||
      lead.company?.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Select Leads</h1>
          <p className="mt-2 text-gray-600">
            Step 2: Choose which contacts to include in this campaign
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">{leads.length}</div>
            <div className="text-sm text-gray-600">Valid Leads</div>
            <div className="text-xs text-gray-500 mt-1">✅ Complete data</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-blue-600">{selectedLeads.size}</div>
            <div className="text-sm text-gray-600">Selected</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-green-600">
              {Math.ceil(selectedLeads.size / 28)}
            </div>
            <div className="text-sm text-gray-600">Days to Send (28/day)</div>
          </div>
        </div>

        {/* Search & Select All */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, or company..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSelectAll}
              className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
            >
              {selectAll ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        </div>

        {/* Leads List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto">
            {filteredLeads.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <div className="text-4xl mb-4">📭</div>
                <p className="text-lg font-medium">No leads found</p>
                <p className="text-sm mt-2">
                  {searchTerm ? 'Try a different search term' : 'Add some contacts first'}
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="w-12 px-4 py-3"></th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Name</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Email</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Company</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Title</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => handleToggleLead(lead.id)}
                      className={`cursor-pointer hover:bg-blue-50 transition-colors ${
                        selectedLeads.has(lead.id) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedLeads.has(lead.id)}
                          onChange={() => {}}
                          className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {lead.first_name} {lead.last_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{lead.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{lead.company || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{lead.title || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => router.push('/campaigns/new')}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
          >
            ← Back
          </button>
          
          <button
            onClick={handleContinue}
            disabled={selectedLeads.size === 0}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Continue to Preview →
          </button>
        </div>

        {/* Info */}
        {selectedLeads.size > 0 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              📊 <strong>{selectedLeads.size} leads selected</strong> - 
              Campaign will take approximately <strong>{Math.ceil(selectedLeads.size / 28)} days</strong> to complete 
              (sending 28 emails per day, 9am-5pm, Monday-Friday)
            </p>
          </div>
        )}
        
        {/* Data Quality Notice */}
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            ✅ <strong>Data Quality:</strong> Only showing leads with complete data (email, first name, last name, company). 
            Leads with missing information are automatically filtered out.
          </p>
        </div>
      </div>
    </div>
  );
}
