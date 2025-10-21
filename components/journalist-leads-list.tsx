"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

export default function JournalistLeadsList({ leads }: Props) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;

    setDeletingId(id);
    try {
      const response = await fetch(`/api/journalist-leads?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete lead");

      router.refresh();
    } catch (error) {
      alert("Failed to delete lead. Please try again.");
    } finally {
      setDeletingId(null);
    }
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
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/20">
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
                  <span className="inline-flex rounded-full gradient-primary px-3 py-1 text-xs font-semibold text-white shadow-sm">
                    {lead.industry}
                  </span>
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
                  <button
                    onClick={() => handleDelete(lead.id)}
                    disabled={deletingId === lead.id}
                    className="text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-50"
                  >
                    {deletingId === lead.id ? "Deleting..." : "Delete"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
