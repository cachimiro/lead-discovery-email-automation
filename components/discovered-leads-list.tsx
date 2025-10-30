"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "./confirm-dialog";

interface DiscoveredLead {
  id: string;
  email: string;
  source: string;
  isValid: boolean;
  company_name?: string;
  industry?: string;
  created_at: string;
  // Manual lead fields
  full_name?: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  company_domain?: string;
  nb_status?: string;
  // AI lead fields
  contact_first_name?: string;
  contact_last_name?: string;
  contact_title?: string;
  company_url?: string;
  email_status?: string;
}

interface Props {
  leads: DiscoveredLead[];
}

export default function DiscoveredLeadsList({ leads: initialLeads }: Props) {
  const router = useRouter();
  const [leads, setLeads] = useState(initialLeads);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterUncategorized, setFilterUncategorized] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingIndustry, setEditingIndustry] = useState("");
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

  const filteredLeads = filterUncategorized
    ? leads.filter((lead) => !lead.industry || lead.industry.trim() === "")
    : leads;

  const uncategorizedCount = leads.filter(
    (lead) => !lead.industry || lead.industry.trim() === ""
  ).length;

  const handleDelete = (id: string, source: string) => {
    const lead = leads.find(l => l.id === id);
    setConfirmDialog({
      isOpen: true,
      title: "Delete Lead",
      message: `Are you sure you want to delete ${lead?.email || 'this lead'}?`,
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        setDeletingId(id);
        try {
          const endpoint = source === "ai" 
            ? `/api/discovered-leads/ai?id=${id}`
            : `/api/discovered-leads?id=${id}`;
          
          const response = await fetch(endpoint, {
            method: "DELETE",
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to delete lead");
          }

          setLeads(leads.filter(l => l.id !== id));
        } catch (error: any) {
          console.error("Delete error:", error);
          alert(`Failed to delete lead: ${error.message}`);
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  const handleEditIndustry = (id: string, currentIndustry: string) => {
    setEditingId(id);
    setEditingIndustry(currentIndustry || "");
  };

  const handleSaveIndustry = async (id: string, source: string) => {
    if (!editingIndustry.trim()) {
      alert("Please enter an industry");
      return;
    }

    try {
      const response = await fetch("/api/discovered-leads/update-industry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          industry: editingIndustry,
          source,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update industry");
      }

      setLeads(leads.map(l => l.id === id ? { ...l, industry: editingIndustry } : l));
      setEditingId(null);
      setEditingIndustry("");
    } catch (error: any) {
      console.error("Update error:", error);
      alert(`Failed to update industry: ${error.message}`);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingIndustry("");
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredLeads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredLeads.map(l => l.id));
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
      title: "Delete Multiple Leads",
      message: `Are you sure you want to delete ${selectedIds.length} lead(s)?`,
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        setIsDeleting(true);
        try {
          // Only delete selected IDs - group by source
          const selectedLeads = leads.filter(l => selectedIds.includes(l.id));
          const aiLeads = selectedLeads.filter(l => l.source === 'ai');
          const manualLeads = selectedLeads.filter(l => l.source !== 'ai');

          const deletePromises = [
            ...aiLeads.map(l => fetch(`/api/discovered-leads/ai?id=${l.id}`, { method: "DELETE" })),
            ...manualLeads.map(l => fetch(`/api/discovered-leads?id=${l.id}`, { method: "DELETE" }))
          ];

          await Promise.all(deletePromises);
          
          setLeads(leads.filter(l => !selectedIds.includes(l.id)));
          setSelectedIds([]);
        } catch (error: any) {
          console.error('Bulk delete error:', error);
          alert(`Failed to delete some leads: ${error.message}`);
        } finally {
          setIsDeleting(false);
        }
      },
    });
  };

  if (leads.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No leads discovered yet</p>
      </div>
    );
  }

  return (
    <div>
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
      {uncategorizedCount > 0 && (
        <div className="mb-4 flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-yellow-800 font-medium">
              ⚠️ {uncategorizedCount} lead{uncategorizedCount !== 1 ? "s" : ""} missing industry category
            </span>
          </div>
          <button
            onClick={() => setFilterUncategorized(!filterUncategorized)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterUncategorized
                ? "bg-yellow-600 text-white hover:bg-yellow-700"
                : "bg-white text-yellow-800 border border-yellow-300 hover:bg-yellow-100"
            }`}
          >
            {filterUncategorized ? "Show All" : "Show Uncategorized Only"}
          </button>
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg px-6 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">
            {selectedIds.length} lead(s) selected
          </span>
          <button
            onClick={handleBulkDelete}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : `Delete ${selectedIds.length} Lead(s)`}
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700 w-12">
                <input
                  type="checkbox"
                  checked={selectedIds.length === filteredLeads.length && filteredLeads.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Title</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Company</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Industry</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Source</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map((lead) => (
              <tr key={lead.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(lead.id)}
                    onChange={() => toggleSelect(lead.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="py-3 px-4 text-sm text-gray-900">{lead.email}</td>
                <td className="py-3 px-4 text-sm text-gray-900">
                  {lead.source === "ai"
                    ? `${lead.contact_first_name || ""} ${lead.contact_last_name || ""}`.trim() || "-"
                    : lead.full_name || `${lead.first_name || ""} ${lead.last_name || ""}`.trim() || "-"}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {lead.source === "ai" ? lead.contact_title || "-" : lead.title || "-"}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">{lead.company_name || "-"}</td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {editingId === lead.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingIndustry}
                        onChange={(e) => setEditingIndustry(e.target.value)}
                        placeholder="Enter industry"
                        className="px-2 py-1 border border-gray-300 rounded text-sm w-32"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveIndustry(lead.id, lead.source)}
                        className="text-green-600 hover:text-green-700 font-medium text-xs"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="text-gray-600 hover:text-gray-700 font-medium text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : lead.industry ? (
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {lead.industry}
                      </span>
                      <button
                        onClick={() => handleEditIndustry(lead.id, lead.industry || "")}
                        className="text-blue-600 hover:text-blue-700 text-xs"
                      >
                        Edit
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEditIndustry(lead.id, "")}
                      className="text-yellow-600 hover:text-yellow-700 font-medium"
                    >
                      + Add Industry
                    </button>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      lead.isValid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {lead.source === "ai" ? lead.email_status || "unknown" : lead.nb_status || "unknown"}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 capitalize">{lead.source || "-"}</td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : "-"}
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => handleDelete(lead.id, lead.source)}
                    disabled={deletingId === lead.id}
                    className="text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-50"
                  >
                    {deletingId === lead.id ? "Deleting..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredLeads.length === 0 && filterUncategorized && (
        <div className="text-center py-12">
          <p className="text-gray-500">All leads are categorized!</p>
        </div>
      )}
    </div>
  );
}
