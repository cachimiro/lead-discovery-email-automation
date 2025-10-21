"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

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
  templateNumber: number;
  existingTemplate?: EmailTemplate;
  userId: string;
}

const AVAILABLE_VARIABLES = [
  { key: "{first_name}", label: "First Name", description: "Contact's first name" },
  { key: "{last_name}", label: "Last Name", description: "Contact's last name" },
  { key: "{full_name}", label: "Full Name", description: "Contact's full name" },
  { key: "{email}", label: "Email", description: "Contact's email address" },
  { key: "{company}", label: "Company", description: "Contact's company name" },
  { key: "{title}", label: "Job Title", description: "Contact's job title" },
  { key: "{journalist_name}", label: "Journalist Name", description: "Name of the journalist" },
  { key: "{publication}", label: "Publication", description: "Publication name" },
  { key: "{subject}", label: "Story Subject", description: "Subject of the story" },
  { key: "{deadline}", label: "Deadline", description: "Story deadline" },
  { key: "{previous_subject}", label: "Previous Subject", description: "Re: + original email subject (for follow-ups)", followUpOnly: true },
];

export default function EmailTemplateForm({
  templateNumber,
  existingTemplate,
  userId,
}: Props) {
  const router = useRouter();
  const [subject, setSubject] = useState(existingTemplate?.subject || "");
  const [body, setBody] = useState(existingTemplate?.body || "");
  const [senderName, setSenderName] = useState(existingTemplate?.sender_name || "Mark Hayward");
  const [senderEmail, setSenderEmail] = useState(existingTemplate?.sender_email || "mark@swaypr.com");
  const [includeThread, setIncludeThread] = useState(existingTemplate?.include_thread ?? true);
  const [isEnabled, setIsEnabled] = useState(existingTemplate?.is_enabled ?? true);
  const [description, setDescription] = useState(existingTemplate?.description || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lastFocused, setLastFocused] = useState<"subject" | "body">("body");
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  const insertVariable = (variable: string, target?: "subject" | "body") => {
    const actualTarget = target || lastFocused;
    if (actualTarget === "subject") {
      const input = subjectInputRef.current;
      if (!input) return;

      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const newValue = subject.substring(0, start) + variable + subject.substring(end);
      setSubject(newValue);

      // Set cursor position after inserted variable
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    } else {
      const textarea = bodyTextareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const newValue = body.substring(0, start) + variable + body.substring(end);
      setBody(newValue);

      // Set cursor position after inserted variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/email-templates", {
        method: existingTemplate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: existingTemplate?.id,
          user_id: userId,
          template_number: templateNumber,
          subject,
          body,
          sender_name: senderName,
          sender_email: senderEmail,
          include_thread: includeThread,
          is_enabled: isEnabled,
          description,
        }),
      });

      if (!response.ok) throw new Error("Failed to save template");

      setMessage({ type: "success", text: "Template saved successfully!" });
      router.refresh();
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save template. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div
          className={`rounded-lg p-4 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Email Settings */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">⚙️ Email Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sender Name
            </label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="Mark Hayward"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sender Email
            </label>
            <input
              type="email"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              placeholder="mark@swaypr.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              templateNumber === 1 ? "Initial outreach" :
              templateNumber === 2 ? "First follow-up" :
              "Final follow-up"
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Enable this email template
            </span>
          </label>

          {templateNumber > 1 && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeThread}
                onChange={(e) => setIncludeThread(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Include previous email thread
              </span>
            </label>
          )}
        </div>

        {templateNumber > 1 && (
          <div className="text-xs text-gray-600 bg-white p-3 rounded border border-gray-200">
            💡 <strong>Thread option:</strong> When enabled, Email #{templateNumber} will include the previous email(s) below your message, showing the conversation history.
          </div>
        )}
      </div>

      {/* Variable Helper Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-3">📝 Available Variables</h3>
        <p className="text-xs text-blue-700 mb-3">
          Click any variable below to insert it at your cursor position in the subject or body
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {AVAILABLE_VARIABLES.filter(v => !v.followUpOnly || templateNumber > 1).map((variable) => (
            <div key={variable.key} className="group relative">
              <button
                type="button"
                onClick={() => insertVariable(variable.key)}
                className={`w-full text-left px-3 py-2 text-xs font-mono bg-white border rounded-md hover:bg-blue-100 hover:border-blue-400 transition-colors ${
                  variable.followUpOnly ? 'border-green-300 bg-green-50' : 'border-blue-300'
                }`}
                title={variable.description}
              >
                {variable.key}
              </button>
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10 w-48 px-3 py-2 text-xs bg-gray-900 text-white rounded-lg shadow-lg">
                <div className="font-semibold">{variable.label}</div>
                <div className="text-gray-300 mt-1">{variable.description}</div>
              </div>
            </div>
          ))}
        </div>
        {templateNumber > 1 && (
          <div className="mt-3 text-xs text-green-800 bg-green-50 p-2 rounded border border-green-200">
            💡 <strong>{"{previous_subject}"}</strong> is available for follow-up emails - it automatically adds "Re: " + the original subject line
          </div>
        )}
      </div>

      <div>
        <label htmlFor={`subject-${templateNumber}`} className="block text-sm font-medium text-gray-700 mb-2">
          Subject Line
        </label>
        <div className="flex gap-2">
          <input
            ref={subjectInputRef}
            type="text"
            id={`subject-${templateNumber}`}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            onFocus={() => setLastFocused("subject")}
            placeholder="Enter email subject..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="text-xs text-gray-500">Quick insert:</span>
          {["{first_name}", "{company}", "{journalist_name}"].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => insertVariable(v, "subject")}
              className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 font-mono"
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor={`body-${templateNumber}`} className="block text-sm font-medium text-gray-700 mb-2">
          Email Body
        </label>
        <textarea
          ref={bodyTextareaRef}
          id={`body-${templateNumber}`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onFocus={() => setLastFocused("body")}
          placeholder="Hi {first_name},&#10;&#10;I noticed that {company}..."
          rows={12}
          className="block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          required
        />
        <div className="mt-2 text-xs text-gray-500">
          💡 Tip: Click on any variable above to insert it at your cursor position
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : existingTemplate ? "Update Template" : "Save Template"}
        </button>
      </div>
    </form>
  );
}
