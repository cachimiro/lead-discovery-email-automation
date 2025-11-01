"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import EditIndustryModal from "./edit-industry-modal";
import EditJournalistLeadModal from "./edit-journalist-lead-modal";
import ConfirmDialog from "./confirm-dialog";

interface JournalistLead {
  id: string;
  journalist_name: string;
  publication: string;
  subject: string;
  industry: string;
  deadline: string;
  linkedin_category?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
}

interface Props {
  leads: JournalistLead[];
}

export default function JournalistLeadsList({ leads: initialLeads }: Props) {
  const router = useRouter();
  const [leads, setLeads] = useState(initialLeads);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingLead, setEditingLead] = useState<JournalistLead | null>(null);
  const [editingFullLead, setEditingFullLead] = useState<JournalistLead | null>(null);
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

  const handleDelete = (id: string) => {
    const lead = leads.find(l => l.id === id);
    setConfirmDialog({
      isOpen: true,
      title: "Delete Journalist Lead",
      message: `Are you sure you want to delete the lead for ${lead?.journalist_name || 'this journalist'}?`,
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        setDeletingId(id);
        try {
          const response = await fetch(`/api/journalist-leads?id=${id}`, {
            method: "DELETE",
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to delete lead");
          }

          setLeads(leads.filter(l => l.id !== id));
        } catch (error: any) {
          console.error('Delete error:', error);
          alert(`Failed to delete lead: ${error.message}`);
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === leads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(leads.map(l => l.id));
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
      title: "Delete Multiple Journalist Leads",
      message: `Are you sure you want to delete ${selectedIds.length} journalist lead(s)?`,
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        setIsDeleting(true);
        try {
          const deletePromises = selectedIds.map(id =>
            fetch(`/api/journalist-leads?id=${id}`, { method: "DELETE" })
          );

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

  const isExpired = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  if (leads.length === 0) {
    return (
      <div className="p-12 text-center">
        <svg
          className="mx-auto h-12 w-12 text-blue-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-lg font-semibold gradient-text">No journalist leads</h3>
        <p className="mt-1 text-sm text-slate-600">
          Get started by adding a new journalist opportunity.
        </p>
      </div>
    );
  }

  return (
    <div>
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 flex items-center justify-between">
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
            <tr className="border-b border-white/20">
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider gradient-text w-12">
                <input
                  type="checkbox"
                  checked={selectedIds.length === leads.length && leads.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider gradient-text">
                Journalist
              </th>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider gradient-text">
              Subject
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider gradient-text">
              Industry
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider gradient-text">
              Deadline
            </th>
            <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider gradient-text">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {leads.map((lead, index) => {
            const expired = isExpired(lead.deadline);
            return (
              <tr
                key={lead.id}
                className={`hover:bg-white/5 transition-all duration-300 animate-fadeIn ${expired ? "opacity-50" : ""}`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(lead.id)}
                    onChange={() => toggleSelect(lead.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-semibold text-slate-900">
                    {lead.journalist_name}
                  </div>
                  <div className="text-sm text-slate-600">{lead.publication}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-slate-900 line-clamp-2">
                    {lead.subject}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {lead.industry && lead.industry.trim() !== '' ? (
                    <span className="inline-flex rounded-full gradient-primary px-3 py-1 text-xs font-semibold text-white shadow-sm">
                      {lead.industry}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800 border border-yellow-300">
                      ⚠️ Missing Industry
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-slate-900">
                    {new Date(lead.deadline).toLocaleDateString()}
                  </div>
                  {expired && (
                    <div className="text-xs text-red-500 font-semibold">Expired</div>
                  )}
                </td>
                <td className="px-6 py-4 text-right text-sm">
                  <div className="flex items-center justify-end gap-3">
                    {(!lead.industry || lead.industry.trim() === '') && (
                      <button
                        onClick={() => setEditingLead(lead)}
                        className="text-yellow-600 hover:text-yellow-700 font-medium transition-colors"
                      >
                        Add Industry
                      </button>
                    )}
                    <button
                      onClick={() => setEditingFullLead(lead)}
                      className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(lead.id)}
                      disabled={deletingId === lead.id}
                      className="text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-50"
                    >
                      {deletingId === lead.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>

      {editingLead && (
        <EditIndustryModal
          leadId={editingLead.id}
          currentIndustry={editingLead.industry || ''}
          journalistName={editingLead.journalist_name}
          onClose={() => setEditingLead(null)}
        />
      )}

      {editingFullLead && (
        <EditJournalistLeadModal
          lead={editingFullLead}
          onClose={() => setEditingFullLead(null)}
          onUpdate={(updatedLead) => {
            setLeads(leads.map(l => l.id === updatedLead.id ? updatedLead : l));
            setEditingFullLead(null);
          }}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        type="danger"
      />
    </div>
  );
}
