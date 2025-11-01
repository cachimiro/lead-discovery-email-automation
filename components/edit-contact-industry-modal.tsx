"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  contactId: string;
  contactName: string;
  currentIndustry: string;
  onClose: () => void;
  onUpdate?: (industry: string) => void;
}

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'E-commerce',
  'Education',
  'Manufacturing',
  'Real Estate',
  'Marketing',
  'Consulting',
  'Retail',
  'Food & Beverage',
  'Travel & Hospitality',
  'Media & Entertainment',
  'Automotive',
  'Energy',
  'Telecommunications',
  'Legal',
  'Non-profit',
  'Other'
];

export default function EditContactIndustryModal({
  contactId,
  contactName,
  currentIndustry,
  onClose,
  onUpdate
}: Props) {
  const router = useRouter();
  const [industry, setIndustry] = useState(currentIndustry || '');
  const [customIndustry, setCustomIndustry] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(
    currentIndustry && !INDUSTRIES.includes(currentIndustry)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const finalIndustry = showCustomInput && customIndustry ? customIndustry : industry;

    if (!finalIndustry) {
      setError('Please select or enter an industry');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/contacts/update-industry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId,
          industry: finalIndustry
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update industry');
      }

      if (onUpdate) {
        onUpdate(finalIndustry);
      }
      
      router.refresh();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {currentIndustry ? 'Update' : 'Add'} Industry
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Contact: <span className="font-medium">{contactName}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industry *
            </label>
            <select
              value={showCustomInput ? 'Other' : industry}
              onChange={(e) => {
                const value = e.target.value;
                if (value === 'Other') {
                  setShowCustomInput(true);
                  setCustomIndustry(industry && !INDUSTRIES.includes(industry) ? industry : '');
                } else {
                  setShowCustomInput(false);
                  setIndustry(value);
                }
              }}
              required={!showCustomInput}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select industry...</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>

            {showCustomInput && (
              <div className="mt-3">
                <input
                  type="text"
                  value={customIndustry}
                  onChange={(e) => setCustomIndustry(e.target.value)}
                  placeholder="Enter custom industry..."
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomIndustry('');
                    setIndustry('');
                  }}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  ← Back to dropdown
                </button>
              </div>
            )}

            <p className="mt-2 text-xs text-gray-500">
              Used to match contacts with journalists in the same industry
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Industry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
