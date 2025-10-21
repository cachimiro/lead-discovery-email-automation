"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

interface JournalistLead {
  id: string;
  journalist_name: string;
  publication: string;
  subject: string;
  industry: string;
  deadline: string;
}

interface Contact {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  title?: string;
}

interface EmailTemplate {
  id: string;
  template_number: number;
  subject: string;
  body: string;
  sender_name?: string;
  sender_email?: string;
  include_thread?: boolean;
  is_enabled?: boolean;
  description?: string;
}

interface Props {
  leads: JournalistLead[];
  contacts: Contact[];
  templates: EmailTemplate[];
  userId: string;
}

export default function EmailMatcher({ leads, contacts, templates, userId }: Props) {
  const router = useRouter();
  const [selectedIndustry, setSelectedIndustry] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<number>(1);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Get unique industries
  const industries = useMemo(() => {
    return Array.from(new Set(leads.map((l) => l.industry))).sort();
  }, [leads]);

  // Get leads for selected industry
  const matchedLeads = useMemo(() => {
    if (!selectedIndustry) return [];
    return leads.filter((l) => l.industry === selectedIndustry);
  }, [leads, selectedIndustry]);

  // Get the first active lead for the industry
  const activeLead = matchedLeads[0];

  // Get selected template
  const template = templates.find((t) => t.template_number === selectedTemplate);

  // Substitute variables in text
  const substituteVariables = (
    text: string, 
    contact: Contact, 
    lead: JournalistLead,
    previousSubject?: string
  ) => {
    let result = text
      .replace(/\[name\]/gi, contact.first_name || contact.email)
      .replace(/\{first_name\}/gi, contact.first_name || "")
      .replace(/\{last_name\}/gi, contact.last_name || "")
      .replace(/\{company\}/gi, contact.company || "your company")
      .replace(/\{title\}/gi, contact.title || "")
      .replace(/\{email\}/gi, contact.email)
      .replace(/\{full_name\}/gi, `${contact.first_name || ""} ${contact.last_name || ""}`.trim() || contact.email)
      .replace(/\{journalist_name\}/gi, lead.journalist_name)
      .replace(/\{publication\}/gi, lead.publication)
      .replace(/\{subject\}/gi, lead.subject)
      .replace(/\{deadline\}/gi, new Date(lead.deadline).toLocaleDateString())
      .replace(/\[Insert name\]/gi, lead.journalist_name)
      .replace(/\[Insert title\]/gi, lead.publication)
      .replace(/\[insert subject\]/gi, lead.subject)
      .replace(/\[company name\]/gi, contact.company || "your company")
      .replace(/\[business name\]/gi, contact.company || "your company");
    
    // Handle {previous_subject} for follow-ups
    if (previousSubject) {
      result = result.replace(/\{previous_subject\}/gi, `Re: ${previousSubject}`);
    }
    
    return result;
  };

  // Build email thread for follow-ups
  const buildEmailThread = (
    currentTemplate: EmailTemplate,
    contact: Contact,
    lead: JournalistLead,
    previousTemplates: EmailTemplate[]
  ): { subject: string; body: string } => {
    // Get the original subject from template #1
    const originalTemplate = previousTemplates[0];
    const originalSubject = originalTemplate 
      ? substituteVariables(originalTemplate.subject, contact, lead)
      : "";
    
    // Substitute variables in current template, passing original subject for {previous_subject}
    const currentSubject = substituteVariables(
      currentTemplate.subject, 
      contact, 
      lead,
      originalSubject
    );
    
    let emailBody = substituteVariables(
      currentTemplate.body, 
      contact, 
      lead,
      originalSubject
    );

    // If this is a follow-up and thread is enabled, add previous emails
    if (currentTemplate.template_number > 1 && currentTemplate.include_thread) {
      const senderName = currentTemplate.sender_name || "Mark Hayward";
      const senderEmail = currentTemplate.sender_email || "mark@swaypr.com";
      
      // Add separator
      emailBody += "\n\n\n";
      emailBody += "─".repeat(60) + "\n\n";
      
      // Add previous emails in reverse order (most recent first)
      for (let i = currentTemplate.template_number - 2; i >= 0; i--) {
        const prevTemplate = previousTemplates[i];
        if (prevTemplate && prevTemplate.is_enabled !== false) {
          const prevSubject = substituteVariables(prevTemplate.subject, contact, lead);
          const prevBody = substituteVariables(prevTemplate.body, contact, lead);
          
          emailBody += `From: ${senderName} <${senderEmail}>\n`;
          emailBody += `Sent: [Date email ${i + 1} was sent]\n`;
          emailBody += `To: ${contact.email}\n`;
          emailBody += `Subject: ${prevSubject}\n\n`;
          emailBody += prevBody;
          emailBody += "\n\n\n";
          
          if (i > 0) {
            emailBody += "─".repeat(60) + "\n\n";
          }
        }
      }
    }

    return { subject: currentSubject, body: emailBody };
  };

  // Preview for first contact
  const previewContact = contacts[0];
  const previewData = template && activeLead && previewContact
    ? buildEmailThread(template, previewContact, activeLead, templates)
    : { subject: "", body: "" };
  const previewSubject = previewData.subject;
  const previewBody = previewData.body;

  const handleSendEmails = async () => {
    if (!selectedIndustry || !activeLead) {
      setMessage({ type: "error", text: "Please select an industry" });
      return;
    }

    if (contacts.length === 0) {
      setMessage({ type: "error", text: "No contacts available to send to" });
      return;
    }

    // Get only enabled templates
    const enabledTemplates = templates.filter(t => t.is_enabled !== false);
    
    if (enabledTemplates.length === 0) {
      setMessage({ type: "error", text: "No email templates are enabled. Please enable at least one template." });
      return;
    }

    setSending(true);
    setMessage(null);

    try {
      // Create campaigns for each contact and each enabled template
      const campaigns = contacts.flatMap((contact) =>
        enabledTemplates.map((template) => {
          const { subject, body } = buildEmailThread(template, contact, activeLead, templates);
          
          return {
            journalist_lead_id: activeLead.id,
            contact_id: contact.id,
            template_number: template.template_number,
            subject: subject,
            body: body,
          };
        })
      );

      const response = await fetch("/api/email-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaigns, user_id: userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create email campaigns");
      }

      const result = await response.json();
      const totalEmails = contacts.length * enabledTemplates.length;
      setMessage({
        type: "success",
        text: `Successfully created ${totalEmails} email campaigns! (${contacts.length} contacts × ${enabledTemplates.length} enabled template${enabledTemplates.length > 1 ? 's' : ''})`,
      });
      router.refresh();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSending(false);
    }
  };

  if (leads.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 shadow-sm text-center">
        <p className="text-gray-600 text-lg">
          No active journalist leads available. Add some leads first!
        </p>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 shadow-sm text-center">
        <p className="text-gray-600 text-lg">
          No contacts available. Add some contacts first!
        </p>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 shadow-sm text-center">
        <p className="text-gray-600 text-lg">
          No email templates available. Create some templates first!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {message && (
        <div
          className={`rounded-xl p-4 font-medium animate-fadeIn ${
            message.type === "success"
              ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border border-green-200"
              : "bg-gradient-to-r from-red-50 to-rose-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        {/* Selection Panel */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Select Options</h2>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Industry
            </label>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select an industry...</option>
              {industries.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
          </div>

          {selectedIndustry && matchedLeads.length > 0 && (
            <div className="rounded-lg bg-blue-50 p-6 border border-blue-200">
              <div className="text-sm font-bold text-blue-900 mb-3">
                Active Lead for {selectedIndustry}
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <div><strong className="text-gray-900">Journalist:</strong> {activeLead.journalist_name}</div>
                <div><strong className="text-gray-900">Publication:</strong> {activeLead.publication}</div>
                <div><strong className="text-gray-900">Subject:</strong> {activeLead.subject}</div>
                <div><strong className="text-gray-900">Deadline:</strong> {new Date(activeLead.deadline).toLocaleDateString()}</div>
              </div>
            </div>
          )}

          {selectedIndustry && matchedLeads.length === 0 && (
            <div className="rounded-lg bg-yellow-50 p-4 text-sm font-medium text-yellow-800 border border-yellow-200">
              No active leads found for this industry
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Template
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.template_number}>
                  Template #{t.template_number}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg bg-gray-50 p-6 border border-gray-200">
            <div className="font-semibold text-gray-900">Contacts to email: {contacts.length}</div>
            <div className="mt-2 text-sm text-gray-600">
              Emails will be created for all contacts in your database
            </div>
          </div>

          <button
            onClick={handleSendEmails}
            disabled={sending || !selectedIndustry || !activeLead}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? "Creating Campaigns..." : "Create Email Campaigns"}
          </button>
        </div>

        {/* Preview Panel */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Email Preview</h2>

          {previewContact && activeLead && template ? (
            <div className="space-y-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">TO:</div>
                <div className="text-sm text-gray-900 font-medium">{previewContact.email}</div>
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">SUBJECT:</div>
                <div className="text-sm font-semibold text-gray-900">{previewSubject}</div>
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">BODY:</div>
                <div className="whitespace-pre-wrap rounded-lg bg-gray-50 p-6 text-sm text-gray-900 border border-gray-200">
                  {previewBody}
                </div>
              </div>

              <div className="rounded-lg bg-green-50 p-4 text-sm font-medium text-green-800 border border-green-200">
                ✓ Variables will be automatically replaced for each contact
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-600 py-12">
              Select an industry and template to see preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
