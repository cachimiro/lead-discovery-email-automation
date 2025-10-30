"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ConfirmDialog from "./confirm-dialog";

interface Campaign {
  id: string;
  name: string;
  status: string;
  created_at: string;
  cold_outreach_contacts?: { count: number }[];
}

interface Props {
  campaigns: Campaign[];
}

export default function CampaignsList({ campaigns: initialCampaigns }: Props) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const handleDelete = (id: string, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Campaign",
      message: `Are you sure you want to delete "${name || 'this campaign'}"? This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        setDeletingId(id);
        try {
          const response = await fetch(`/api/campaigns?id=${id}`, {
            method: "DELETE",
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to delete campaign");
          }

          // Update local state immediately
          setCampaigns(campaigns.filter(c => c.id !== id));
        } catch (error: any) {
          console.error('Delete error:', error);
          alert(`Failed to delete campaign: ${error.message}`);
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === campaigns.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(campaigns.map(c => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    
    setConfirmDialog({
      isOpen: true,
      title: "Delete Multiple Campaigns",
      message: `Are you sure you want to delete ${selectedIds.length} campaign(s)? This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        setIsDeleting(true);
        try {
          // Only delete the selected IDs
          const deletePromises = selectedIds.map(id =>
            fetch(`/api/campaigns?id=${id}`, { method: "DELETE" })
          );

          await Promise.all(deletePromises);
          
          // Update local state immediately - remove only selected campaigns
          setCampaigns(campaigns.filter(c => !selectedIds.includes(c.id)));
          setSelectedIds([]);
        } catch (error: any) {
          console.error('Bulk delete error:', error);
          alert(`Failed to delete some campaigns: ${error.message}`);
        } finally {
          setIsDeleting(false);
        }
      },
    });
  };

  if (campaigns.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="text-6xl mb-4">📧</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No campaigns yet</h3>
        <p className="text-gray-600 mb-6">Create your first email campaign to get started</p>
        <Link
          href="/campaigns/new"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
        >
          <span className="text-xl">+</span>
          Create Your First Campaign
        </Link>
      </div>
    );
  }

  return (
    <>
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
      
      <div>
        {selectedIds.length > 0 && (
          <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedIds.length} campaign(s) selected
            </span>
            <button
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : `Delete ${selectedIds.length} Campaign(s)`}
            </button>
          </div>
        )}
        <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900 w-12">
              <input
                type="checkbox"
                checked={selectedIds.length === campaigns.length}
                onChange={toggleSelectAll}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </th>
            <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Campaign Name</th>
            <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Status</th>
            <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Contacts</th>
            <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Created</th>
            <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Actions</th>
          </tr>
        </thead>
      <tbody className="divide-y divide-gray-200">
        {campaigns.map((campaign) => (
          <tr key={campaign.id} className="hover:bg-gray-50">
            <td className="px-6 py-4">
              <input
                type="checkbox"
                checked={selectedIds.includes(campaign.id)}
                onChange={() => toggleSelect(campaign.id)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </td>
            <td className="px-6 py-4 text-sm font-medium text-gray-900">
              {campaign.name || 'Unnamed Campaign'}
            </td>
            <td className="px-6 py-4 text-sm">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                campaign.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : campaign.status === 'draft'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {campaign.status}
              </span>
            </td>
            <td className="px-6 py-4 text-sm text-gray-600">
              {campaign.cold_outreach_contacts?.[0]?.count || 0}
            </td>
            <td className="px-6 py-4 text-sm text-gray-600">
              {new Date(campaign.created_at).toLocaleDateString()}
            </td>
            <td className="px-6 py-4 text-sm">
              <div className="flex items-center gap-3">
                {campaign.status === 'active' ? (
                  <Link
                    href={`/campaigns/${campaign.id}/dashboard`}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View Dashboard →
                  </Link>
                ) : campaign.status === 'draft' ? (
                  <Link
                    href={`/campaigns/${campaign.id}/select-leads`}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Continue Setup →
                  </Link>
                ) : (
                  <Link
                    href={`/campaigns/${campaign.id}/dashboard`}
                    className="text-gray-600 hover:text-gray-700 font-medium"
                  >
                    View →
                  </Link>
                )}
                <button
                  onClick={() => handleDelete(campaign.id, campaign.name)}
                  disabled={deletingId === campaign.id}
                  className="text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-50"
                >
                  {deletingId === campaign.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
      </div>
    </>
  );
}
