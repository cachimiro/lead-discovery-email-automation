"use client";

import { useState, useEffect } from "react";
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
  const [detectingIndustry, setDetectingIndustry] = useState(false);
  const [industryConfidence, setIndustryConfidence] = useState<'high' | 'low' | null>(null);
  const [industryDetected, setIndustryDetected] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null);

  // Auto-detect industry when subject or publication changes
  useEffect(() => {
    const detectIndustry = async () => {
      if (!formData.subject && !formData.publication) return;
      if (formData.industry && industryDetected) return; // Don't override manual input

      setDetectingIndustry(true);
      setMessage(null);

      try {
        const response = await fetch("/api/detect-industry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: formData.subject,
            publication: formData.publication,
            journalist_name: formData.journalist_name,
          }),
        });

        const data = await response.json();

        if (data.industry) {
          setFormData((prev) => ({ ...prev, industry: data.industry }));
          setIndustryConfidence(data.confidence);
          setIndustryDetected(true);
          setMessage({ 
            type: "success", 
            text: `Industry detected: ${data.industry} (${data.confidence} confidence)` 
          });
        } else {
          setIndustryConfidence('low');
          setMessage({ 
            type: "warning", 
            text: "⚠️ Could not auto-detect industry. Please enter it manually." 
          });
        }
      } catch (error) {
        console.error("Error detecting industry:", error);
        setMessage({ 
          type: "warning", 
          text: "⚠️ Could not auto-detect industry. Please enter it manually." 
        });
      } finally {
        setDetectingIndustry(false);
      }
    };

    // Debounce the detection
    const timeoutId = setTimeout(detectIndustry, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData.subject, formData.publication, formData.journalist_name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate industry is present
    if (!formData.industry || formData.industry.trim() === "") {
      setMessage({ 
        type: "error", 
        text: "⚠️ Industry is required. Please enter an industry before saving." 
      });
      return;
    }

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
      setIndustryDetected(false);
      setIndustryConfidence(null);
      
      // Refresh the page to show new lead
      router.refresh();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // If user manually changes industry, mark it as manually set
    if (name === 'industry') {
      setIndustryDetected(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <div
          className={`rounded-lg p-4 text-sm font-medium ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : message.type === "warning"
              ? "bg-yellow-50 text-yellow-800 border border-yellow-200"
              : "bg-red-50 text-red-800 border border-red-200"
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
            Industry * {detectingIndustry && <span className="text-blue-600 text-xs">(detecting...)</span>}
          </label>
          <div className="relative">
            <input
              type="text"
              id="industry"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              placeholder="e.g., Healthcare, Technology, Construction"
              className={`mt-1 block w-full rounded-lg border px-4 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 ${
                industryConfidence === 'high' 
                  ? 'border-green-300 focus:border-green-500 focus:ring-green-500 bg-green-50' 
                  : industryConfidence === 'low' || (!formData.industry && (formData.subject || formData.publication))
                  ? 'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500 bg-yellow-50'
                  : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
              required
            />
            {industryConfidence === 'high' && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 text-sm">
                ✓ Auto-detected
              </span>
            )}
            {industryConfidence === 'low' && formData.industry && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-600 text-sm">
                ⚠️ Manual
              </span>
            )}
          </div>
          {!formData.industry && (formData.subject || formData.publication) && !detectingIndustry && (
            <p className="mt-1 text-xs text-yellow-700">
              ⚠️ Industry is required. Please enter it manually if auto-detection failed.
            </p>
          )}
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
