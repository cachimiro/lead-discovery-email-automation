"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  userId: string;
}

export default function AddJournalistLeadForm({ userId }: Props) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    journalist_name: "",
    publication: "",
    subject: "",
    industry: "",
    deadline: "",
    linkedin_category: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/journalist-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, user_id: userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add lead");
      }

      setMessage({ type: "success", text: "Journalist lead added successfully!" });
      setFormData({
        journalist_name: "",
        publication: "",
        subject: "",
        industry: "",
        deadline: "",
        linkedin_category: "",
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
          className={`rounded-lg p-4 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="journalist_name" className="block text-sm font-medium text-slate-700">
            Journalist Name *
          </label>
          <input
            type="text"
            id="journalist_name"
            name="journalist_name"
            value={formData.journalist_name}
            onChange={handleChange}
            placeholder="Alex Wright"
            className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="publication" className="block text-sm font-medium text-slate-700">
            Publication/Company *
          </label>
          <input
            type="text"
            id="publication"
            name="publication"
            value={formData.publication}
            onChange={handleChange}
            placeholder="Dentsu"
            className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="subject" className="block text-sm font-medium text-slate-700">
            Subject/Topic *
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder="Sleep specialist / expert to discuss impact of jet lag"
            className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="industry" className="block text-sm font-medium text-slate-700">
            Industry *
          </label>
          <input
            type="text"
            id="industry"
            name="industry"
            value={formData.industry}
            onChange={handleChange}
            placeholder="Sleep"
            className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="deadline" className="block text-sm font-medium text-slate-700">
            Deadline *
          </label>
          <input
            type="date"
            id="deadline"
            name="deadline"
            value={formData.deadline}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="linkedin_category" className="block text-sm font-medium text-slate-700">
            LinkedIn Category
          </label>
          <input
            type="text"
            id="linkedin_category"
            name="linkedin_category"
            value={formData.linkedin_category}
            onChange={handleChange}
            placeholder="Retail Apparel and Fashion"
            className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            placeholder="Additional information..."
            rows={3}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Adding..." : "Add Lead"}
        </button>
      </div>
    </form>
  );
}
