"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "./confirm-dialog";
import EditContactIndustryModal from "./edit-contact-industry-modal";

interface Contact {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  title?: string;
  industry?: string;
  notes?: string;
  created_at: string;
}

interface Props {
  contacts: Contact[];
}

interface LeadPool {
  id: string;
  name: string;
  color: string;
}

export default function ContactsList({ contacts: initialContacts }: Props) {
  const router = useRouter();
  const [contacts, setContacts] = useState(initialContacts);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPoolModal, setShowPoolModal] = useState(false);
  const [pools, setPools] = useState<LeadPool[]>([]);
  const [loadingPools, setLoadingPools] = useState(false);
  const [editingIndustry, setEditingIndustry] = useState<Contact | null>(null);
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

  // Count contacts without industry
  const contactsWithoutIndustry = contacts.filter(
    (contact) => !contact.industry || contact.industry.trim() === ''
  );

  const filteredContacts = contacts.filter((contact) => {
    const search = searchTerm.toLowerCase();
    return (
      contact.email.toLowerCase().includes(search) ||
      contact.first_name?.toLowerCase().includes(search) ||
      contact.last_name?.toLowerCase().includes(search) ||
      contact.company?.toLowerCase().includes(search) ||
      contact.title?.toLowerCase().includes(search)
    );
  });

  const handleDelete = (id: string) => {
    const contact = contacts.find(c => c.id === id);
    setConfirmDialog({
      isOpen: true,
      title: "Delete Contact",
      message: `Are you sure you want to delete ${contact?.email || 'this contact'}?`,
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        setDeletingId(id);
        try {
          const response = await fetch(`/api/contacts?id=${id}`, {
            method: "DELETE",
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to delete contact");
          }

          setContacts(contacts.filter(c => c.id !== id));
        } catch (error: any) {
          console.error('Delete error:', error);
          alert(`Failed to delete contact: ${error.message}`);
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredContacts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredContacts.map(c => c.id));
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
      title: "Delete Multiple Contacts",
      message: `Are you sure you want to delete ${selectedIds.length} contact(s)?`,
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        setIsDeleting(true);
        try {
          const deletePromises = selectedIds.map(id =>
            fetch(`/api/contacts?id=${id}`, { method: "DELETE" })
          );

          await Promise.all(deletePromises);
          
          setContacts(contacts.filter(c => !selectedIds.includes(c.id)));
          setSelectedIds([]);
        } catch (error: any) {
          console.error('Bulk delete error:', error);
          alert(`Failed to delete some contacts: ${error.message}`);
        } finally {
          setIsDeleting(false);
        }
      },
    });
  };

  const handleAddToPool = async () => {
    if (selectedIds.length === 0) return;
    
    setLoadingPools(true);
    try {
      const response = await fetch('/api/lead-pools');
      const data = await response.json();
      if (data.success) {
        setPools(data.pools);
        setShowPoolModal(true);
      }
    } catch (error) {
      console.error('Error fetching pools:', error);
      alert('Failed to load pools');
    } finally {
      setLoadingPools(false);
    }
  };

  const handlePoolSelection = async (poolId: string) => {
    try {
      const response = await fetch(`/api/lead-pools/${poolId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactIds: selectedIds })
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message || 'Contacts added to pool successfully');
        setShowPoolModal(false);
        setSelectedIds([]);
      } else {
        alert(data.error || 'Failed to add contacts to pool');
      }
    } catch (error) {
      console.error('Error adding contacts to pool:', error);
      alert('Failed to add contacts to pool');
    }
  };

  const exportToCSV = () => {
    const headers = ["Email", "First Name", "Last Name", "Company", "Title", "Notes"];
    const rows = contacts.map((c) => [
      c.email,
      c.first_name || "",
      c.last_name || "",
      c.company || "",
      c.title || "",
      c.notes || "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contacts-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (contacts.length === 0) {
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
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <h3 className="mt-2 text-lg font-semibold gradient-text">No contacts</h3>
        <p className="mt-1 text-sm text-slate-600">Get started by adding a new contact.</p>
      </div>
    );
  }

  return (
    <div>
      {contactsWithoutIndustry.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 m-6 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                ⚠️ {contactsWithoutIndustry.length} contact{contactsWithoutIndustry.length !== 1 ? 's' : ''} missing industry
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                These contacts cannot be matched with journalists until an industry is assigned. Click "Add Industry" to fix.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="border-b border-white/20 p-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-premium w-full"
            />
          </div>
          {selectedIds.length > 0 && (
            <>
              <button
                onClick={handleAddToPool}
                disabled={loadingPools}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loadingPools ? "Loading..." : `Add ${selectedIds.length} to Pool`}
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : `Delete ${selectedIds.length}`}
              </button>
            </>
          )}
          <button
            onClick={exportToCSV}
            className="btn-secondary"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/20">
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider gradient-text w-12">
                <input
                  type="checkbox"
                  checked={selectedIds.length === filteredContacts.length && filteredContacts.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider gradient-text">
                Contact
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider gradient-text">
                Company
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider gradient-text">
                Title
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider gradient-text">
                Industry
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider gradient-text">
                Notes
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider gradient-text">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filteredContacts.map((contact, index) => (
              <tr 
                key={contact.id} 
                className="hover:bg-white/5 transition-all duration-300 animate-fadeIn"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(contact.id)}
                    onChange={() => toggleSelect(contact.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-semibold text-slate-900">
                    {contact.first_name || contact.last_name
                      ? `${contact.first_name || ""} ${contact.last_name || ""}`.trim()
                      : "—"}
                  </div>
                  <div className="text-sm text-slate-600">{contact.email}</div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-900">
                  {contact.company || "—"}
                </td>
                <td className="px-6 py-4 text-sm text-slate-900">
                  {contact.title || "—"}
                </td>
                <td className="px-6 py-4">
                  {contact.industry && contact.industry.trim() !== '' ? (
                    <span className="inline-flex rounded-full gradient-primary px-3 py-1 text-xs font-semibold text-white shadow-sm">
                      {contact.industry}
                    </span>
                  ) : (
                    <button
                      onClick={() => setEditingIndustry(contact)}
                      className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800 border border-yellow-300 hover:bg-yellow-200 transition-colors"
                    >
                      ⚠️ Add Industry
                    </button>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {contact.notes ? (
                    <span className="line-clamp-2">{contact.notes}</span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-6 py-4 text-right text-sm">
                  {contact.industry && contact.industry.trim() !== '' && (
                    <button
                      onClick={() => setEditingIndustry(contact)}
                      className="text-blue-600 hover:text-blue-700 font-medium transition-colors mr-3"
                    >
                      Edit Industry
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(contact.id)}
                    disabled={deletingId === contact.id}
                    className="text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-50"
                  >
                    {deletingId === contact.id ? "Deleting..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredContacts.length === 0 && searchTerm && (
        <div className="p-12 text-center">
          <p className="text-sm text-slate-600">
            No contacts found matching "{searchTerm}"
          </p>
        </div>
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

      {/* Pool Selection Modal */}
      {showPoolModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Add to Pool
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Select a pool to add {selectedIds.length} contact(s) to:
            </p>

            {pools.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No pools available</p>
                <button
                  onClick={() => router.push('/lead-pools')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Create a Pool
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {pools.map((pool) => (
                  <button
                    key={pool.id}
                    onClick={() => handlePoolSelection(pool.id)}
                    className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: pool.color }}
                    />
                    <span className="font-medium text-gray-900">{pool.name}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={() => setShowPoolModal(false)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {editingIndustry && (
        <EditContactIndustryModal
          contactId={editingIndustry.id}
          contactName={`${editingIndustry.first_name || ''} ${editingIndustry.last_name || ''}`.trim() || editingIndustry.email}
          currentIndustry={editingIndustry.industry || ''}
          onClose={() => setEditingIndustry(null)}
          onUpdate={(industry) => {
            setContacts(contacts.map(c => 
              c.id === editingIndustry.id ? { ...c, industry } : c
            ));
            setEditingIndustry(null);
          }}
        />
      )}
    </div>
  );
}
