"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  userId: string;
}

export default function AddContactForm({ userId }: Props) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    company: "",
    title: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, user_id: userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add contact");
      }

      setMessage({ type: "success", text: "Contact added successfully!" });
      setFormData({
        email: "",
        first_name: "",
        last_name: "",
        company: "",
        title: "",
        notes: "",
      });
      router.refresh();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="contact@example.com"
            className="input-premium"
            required
          />
        </div>

        <div>
          <label htmlFor="company" className="block text-sm font-medium text-slate-700">
            Company
          </label>
          <input
            type="text"
            id="company"
            name="company"
            value={formData.company}
            onChange={handleChange}
            placeholder="Company Name"
            className="input-premium"
          />
        </div>

        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-slate-700">
            First Name
          </label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            placeholder="John"
            className="input-premium"
          />
        </div>

        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-slate-700">
            Last Name
          </label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            placeholder="Doe"
            className="input-premium"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="title" className="block text-sm font-medium text-slate-700">
            Job Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Marketing Director"
            className="input-premium"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="notes" className="block text-sm font-medium text-slate-700">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Additional notes about this contact..."
            rows={3}
            className="input-premium"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Adding...
            </span>
          ) : "Add Contact"}
        </button>
      </div>
    </form>
  );
}
