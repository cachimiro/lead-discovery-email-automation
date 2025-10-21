"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

interface Props {
  contacts: Contact[];
}

export default function ContactsList({ contacts }: Props) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;

    setDeletingId(id);
    try {
      const response = await fetch(`/api/contacts?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete contact");

      router.refresh();
    } catch (error) {
      alert("Failed to delete contact. Please try again.");
    } finally {
      setDeletingId(null);
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
                <td className="px-6 py-4 text-sm text-slate-600">
                  {contact.notes ? (
                    <span className="line-clamp-2">{contact.notes}</span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-6 py-4 text-right text-sm">
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
    </div>
  );
}
