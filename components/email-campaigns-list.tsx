"use client";

import { useState } from "react";

interface Campaign {
  id: string;
  subject: string;
  body: string;
  status: string;
  created_at: string;
  sent_at?: string;
  cold_outreach_journalist_leads?: {
    journalist_name: string;
    publication: string;
    industry: string;
  };
  cold_outreach_contacts?: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
  // Legacy support
  journalist_leads?: {
    journalist_name: string;
    publication: string;
    industry: string;
  };
  contacts?: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

interface Props {
  campaigns: Campaign[];
}

export default function EmailCampaignsList({ campaigns }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (campaigns.length === 0) {
    return (
      <div className="p-12 text-center">
        <svg
          className="mx-auto h-12 w-12 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-slate-900">No email campaigns</h3>
        <p className="mt-1 text-sm text-slate-500">
          Create campaigns from the Match & Send Emails page.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-200">
      {campaigns.map((campaign) => (
        <div key={campaign.id} className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="font-medium text-slate-900">{campaign.subject}</h3>
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                    campaign.status === "sent"
                      ? "bg-green-100 text-green-800"
                      : campaign.status === "failed"
                      ? "bg-red-100 text-red-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {campaign.status}
                </span>
              </div>
              <div className="mt-1 text-sm text-slate-600">
                To: {(campaign.cold_outreach_contacts || campaign.contacts)?.first_name || (campaign.cold_outreach_contacts || campaign.contacts)?.email || "Unknown"} ({(campaign.cold_outreach_contacts || campaign.contacts)?.email || "N/A"})
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Lead: {(campaign.cold_outreach_journalist_leads || campaign.journalist_leads)?.journalist_name || "Unknown"} at {(campaign.cold_outreach_journalist_leads || campaign.journalist_leads)?.publication || "Unknown"} ({(campaign.cold_outreach_journalist_leads || campaign.journalist_leads)?.industry || "N/A"})
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Created: {new Date(campaign.created_at).toLocaleString()}
              </div>
            </div>
            <button
              onClick={() => setExpandedId(expandedId === campaign.id ? null : campaign.id)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {expandedId === campaign.id ? "Hide" : "View"} Email
            </button>
          </div>

          {expandedId === campaign.id && (
            <div className="mt-4 rounded-lg bg-slate-50 p-4">
              <div className="mb-2 text-xs font-medium text-slate-500">EMAIL BODY:</div>
              <div className="whitespace-pre-wrap text-sm text-slate-900">
                {campaign.body}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
