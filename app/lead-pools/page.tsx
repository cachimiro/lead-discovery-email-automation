'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface LeadPool {
  id: string;
  name: string;
  description: string;
  color: string;
  contact_count: number;
  created_at: string;
}

export default function LeadPoolsPage() {
  const router = useRouter();
  const [pools, setPools] = useState<LeadPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPool, setEditingPool] = useState<LeadPool | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });

  const colors = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Orange', value: '#F59E0B' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Teal', value: '#14B8A6' },
    { name: 'Indigo', value: '#6366F1' }
  ];

  useEffect(() => {
    fetchPools();
  }, []);

  const fetchPools = async () => {
    try {
      const response = await fetch('/api/lead-pools');
      const data = await response.json();
      
      if (response.status === 401) {
        console.error('Unauthorized - please login');
        // Don't redirect, just show empty state
        setPools([]);
        setLoading(false);
        return;
      }
      
      if (data.success) {
        setPools(data.pools);
      } else {
        console.error('Error fetching pools:', data.error);
        setPools([]);
      }
    } catch (error) {
      console.error('Error fetching pools:', error);
      setPools([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPool(null);
    setFormData({ name: '', description: '', color: '#3B82F6' });
    setShowCreateModal(true);
  };

  const handleEdit = (pool: LeadPool) => {
    setEditingPool(pool);
    setFormData({
      name: pool.name,
      description: pool.description || '',
      color: pool.color
    });
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    try {
      const url = editingPool 
        ? `/api/lead-pools/${editingPool.id}`
        : '/api/lead-pools';
      
      const method = editingPool ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setShowCreateModal(false);
        
        // If creating a new pool, redirect to add contacts page
        if (!editingPool && data.pool) {
          router.push(`/lead-pools/${data.pool.id}/add-contacts`);
        } else {
          fetchPools();
        }
      } else {
        alert(data.error || 'Failed to save pool');
      }
    } catch (error) {
      console.error('Error saving pool:', error);
      alert('Failed to save pool');
    }
  };

  const handleDelete = async (poolId: string, poolName: string) => {
    if (!confirm(`Are you sure you want to delete "${poolName}"? This will not delete the contacts, only the pool.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/lead-pools/${poolId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        fetchPools();
      } else {
        alert(data.error || 'Failed to delete pool');
      }
    } catch (error) {
      console.error('Error deleting pool:', error);
      alert('Failed to delete pool');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading pools...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Lead Pools</h1>
          <p className="mt-2 text-gray-600">
            Organize your contacts into pools for targeted campaigns
          </p>
        </div>

        {/* Create Button */}
        <div className="mb-6">
          <button
            onClick={handleCreate}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            + Create New Pool
          </button>
        </div>

        {/* Pools Grid */}
        {pools.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No pools yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first pool to organize contacts for targeted campaigns
            </p>
            <button
              onClick={handleCreate}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Create Your First Pool
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pools.map((pool) => (
              <div
                key={pool.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                {/* Pool Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: pool.color }}
                    />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {pool.name}
                    </h3>
                  </div>
                </div>

                {/* Description */}
                {pool.description && (
                  <p className="text-sm text-gray-600 mb-4">
                    {pool.description}
                  </p>
                )}

                {/* Stats */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {pool.contact_count}
                  </div>
                  <div className="text-sm text-gray-600">
                    {pool.contact_count === 1 ? 'contact' : 'contacts'}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/lead-pools/${pool.id}`)}
                    className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                  >
                    View Contacts
                  </button>
                  <button
                    onClick={() => handleEdit(pool)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(pool.id, pool.name)}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {editingPool ? 'Edit Pool' : 'Create New Pool'}
              </h2>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pool Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Q1 Sales Leads"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this pool"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {colors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setFormData({ ...formData, color: color.value })}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          formData.color === color.value
                            ? 'border-gray-900 scale-110'
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                        title={color.name}
                      >
                        <div
                          className="w-full h-6 rounded"
                          style={{ backgroundColor: color.value }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formData.name.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {editingPool ? 'Save Changes' : 'Create Pool'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
