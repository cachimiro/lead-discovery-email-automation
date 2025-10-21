"use client";
import { useState, useEffect } from "react";
import { useToast } from "@/contexts/toast-context";
import { useSearch } from "@/contexts/search-context";

function inferDomainFromEmail(email?: string) {
  if (!email) return undefined;
  const at = email.indexOf("@");
  return at > -1 ? email.slice(at + 1) : undefined;
}

function normDomain(s?: string | null) {
  if (!s) return "";
  return s
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0];
}

// High-level decision maker categories only
const DECISION_MAKER_ROLES = [
  { value: "ceo", label: "CEO / Founder" },
  { value: "marketing", label: "Marketing Director" },
  { value: "sales", label: "Sales Director" },
  { value: "operations", label: "Operations Director" },
  { value: "finance", label: "Finance Director" },
  { value: "hr", label: "HR Director" },
];

export default function DiscoverPage() {
  const { showWarning, showSuccess, showError } = useToast();
  const { searchState, startSearch, clearResults } = useSearch();
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  
  // Company domains to search
  const [domains, setDomains] = useState<string[]>([""]);
  
  // Selected decision maker categories
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["ceo", "marketing"]);

  // Update selected leads when search results change
  useEffect(() => {
    if (searchState.results.length > 0 && !searchState.isSearching) {
      const validEmails = searchState.results
        .filter((r) => r.verified_status === "valid")
        .map((r) => r.email);
      setSelectedLeads(new Set(validEmails));
      
      if (validEmails.length > 0) {
        setMsg(`Found ${validEmails.length} valid decision maker${validEmails.length > 1 ? 's' : ''}! Select the ones you want to save.`);
      }
    }
  }, [searchState.results, searchState.isSearching]);

  function updateDomain(i: number, val: string) {
    const next = [...domains];
    next[i] = val;
    setDomains(next);
  }
  
  function addDomain() {
    setDomains((d) => [...d, ""]);
  }
  
  function removeDomain(i: number) {
    setDomains((d) => d.filter((_, idx) => idx !== i));
  }

  function toggleRole(role: string) {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }

  function toggleLead(email: string) {
    setSelectedLeads((prev) => {
      const next = new Set(prev);
      if (next.has(email)) {
        next.delete(email);
      } else {
        next.add(email);
      }
      return next;
    });
  }

  function selectAllValid() {
    const validEmails = searchState.results
      .filter((r) => r.verified_status === "valid")
      .map((r) => r.email);
    setSelectedLeads(new Set(validEmails));
  }

  function deselectAll() {
    setSelectedLeads(new Set());
  }

  async function saveLeads() {
    if (selectedLeads.size === 0) {
      setMsg("Please select at least one lead to save.");
      showWarning("No Selection", "Please select at least one lead to save.");
      return;
    }

    const leadsToSave = searchState.results.filter(
      (r) => selectedLeads.has(r.email) && r.verified_status === "valid"
    );
    
    if (leadsToSave.length === 0) {
      setMsg("No valid leads selected.");
      showWarning("No Valid Leads", "No valid leads selected.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leads: leadsToSave.map((lead) => ({
            email: lead.email,
            fullName: lead.fullName,
            title: lead.title,
            companyName: lead.companyName,
            company_domain: lead.company_domain || inferDomainFromEmail(lead.email),
            verified_status: "valid",
            amf_email_status: lead.email_status,
            source: "decision_maker",
            decision_categories: searchState.selectedRoles,
          })),
        }),
      }).then((r) => r.json());

      if (res.checkoutUrl || res.batchId) {
        setMsg(`✅ Successfully saved ${leadsToSave.length} lead${leadsToSave.length > 1 ? 's' : ''}!`);
        showSuccess("Leads Saved!", `${leadsToSave.length} lead${leadsToSave.length > 1 ? 's' : ''} saved to your account.`);
        
        // Clear the saved leads from selection
        const remainingLeads = new Set(
          Array.from(selectedLeads).filter(email => !leadsToSave.find(l => l.email === email))
        );
        setSelectedLeads(remainingLeads);
      } else {
        setMsg("❌ Could not save leads. Please try again.");
        showError("Save Failed", "Could not save leads. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setMsg("Error saving leads. Please try again.");
      showError("Error", "Error saving leads. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setSelectedLeads(new Set());

    const cleaned = Array.from(new Set(domains.map(normDomain).filter(Boolean)));
    
    if (cleaned.length === 0) {
      setMsg("Please enter at least one company domain.");
      showWarning("Missing Input", "Please enter at least one company domain.");
      return;
    }

    if (selectedRoles.length === 0) {
      setMsg("Please select at least one decision maker role.");
      showWarning("Missing Input", "Please select at least one decision maker role.");
      return;
    }

    // Clear previous results and start new search
    clearResults();
    await startSearch(cleaned, selectedRoles);
  }

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Decision Maker Discovery</h1>
        <p className="text-gray-600">
          Find and verify decision maker emails at target companies
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Find Decision Makers</h2>
            <p className="text-gray-600 text-sm">Enter company domains and select the decision maker roles you want to target</p>
          </div>

          {/* Company Domains */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">Company Domain(s)</label>
            <p className="text-xs text-gray-500 mb-2">Enter the website domain (e.g., microsoft.com, apple.com)</p>
            {domains.map((d, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={i === 0 ? "microsoft.com" : "anotherdomain.com"}
                  value={d}
                  onChange={(e) => updateDomain(i, e.target.value)}
                />
                {domains.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDomain(i)}
                    className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addDomain}
              className="px-4 py-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
            >
              + Add Another Domain
            </button>
          </div>

          {/* Decision Maker Roles */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">Decision Maker Roles</label>
            <p className="text-xs text-gray-500 mb-2">Select the high-level positions you want to target</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {DECISION_MAKER_ROLES.map((role) => (
                <label
                  key={role.value}
                  className={`flex items-center gap-2 px-4 py-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedRoles.includes(role.value)
                      ? "bg-blue-50 border-blue-500 text-blue-700"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role.value)}
                    onChange={() => toggleRole(role.value)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">{role.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={searchState.isSearching}
          >
            {searchState.isSearching ? "Searching..." : "Find Decision Makers"}
          </button>
        </form>

        {msg && (
          <div
            className={`mt-6 rounded-lg p-4 text-sm ${
              msg.includes("valid") || msg.includes("saved")
                ? "bg-green-50 text-green-800 border border-green-200"
                : msg.includes("Searching")
                ? "bg-blue-50 text-blue-800 border border-blue-200"
                : "bg-amber-50 text-amber-800 border border-amber-200"
            }`}
          >
            {msg}
          </div>
        )}
      </div>

      {/* Results */}
      {searchState.results.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Search Results</h2>
              <p className="text-sm text-gray-600 mt-1">
                {selectedLeads.size} of {searchState.results.filter((r) => r.verified_status === "valid").length} valid leads selected
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={selectAllValid}
                className="px-4 py-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
              >
                Select All Valid
              </button>
              <button
                onClick={deselectAll}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100"
              >
                Deselect All
              </button>
              <button
                onClick={saveLeads}
                disabled={saving || selectedLeads.size === 0}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? "Saving..." : `Save ${selectedLeads.size} Lead${selectedLeads.size !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 w-12">Select</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Title</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Company</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {searchState.results.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {row.verified_status === "valid" && (
                        <input
                          type="checkbox"
                          checked={selectedLeads.has(row.email)}
                          onChange={() => toggleLead(row.email)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{row.fullName || "-"}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{row.title || "-"}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{row.email}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{row.companyName || row.company_domain || "-"}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          row.verified_status === "valid"
                            ? "bg-green-100 text-green-800"
                            : row.verified_status === "invalid"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {row.verified_status || "unknown"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
