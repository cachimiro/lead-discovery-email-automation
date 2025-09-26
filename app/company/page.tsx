"use client";
import { useState } from "react";
import FormField from "@/components/form-field";
import ResultsTable from "@/components/results-table";

type Candidate = {
  email: string;
  email_status?: string;
  domain: string;
};

function normDomain(s?: string | null) {
  if (!s) return "";
  return s.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
}

export default function CompanyPage() {
  const [domains, setDomains] = useState<string[]>([""]);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

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

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setRows([]);
    setMsg(null);
    setLoading(true);

    try {
      const form = new FormData(e.currentTarget);
      const email_type = ((form.get("email_type") as string | undefined) || "any")
        .toLowerCase()
        .trim() as "any" | "personal" | "generic";

      // 1) Clean & de-dupe domains
      const cleaned = Array.from(
        new Set(domains.map(normDomain).filter(Boolean))
      );
      if (cleaned.length === 0) {
        setMsg("Please enter at least one company domain.");
        setLoading(false);
        return;
      }

      // 2) For each domain, call AMF (company mode)
      const allCandidates: Candidate[] = [];
      for (let i = 0; i < cleaned.length; i++) {
        const domain = cleaned[i];
        const amf = await fetch("/api/discover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "company", domain, email_type }),
        }).then((r) => r.json());

        const candidates = (amf?.emails ?? []).map((email: string) => ({
          email,
          email_status: amf.email_status,
          domain,
        })) as Candidate[];

        allCandidates.push(...candidates);

        // small delay to be polite to the AMF API
        if (i < cleaned.length - 1) {
          await new Promise((r) => setTimeout(r, 150));
        }
      }

      if (allCandidates.length === 0) {
        setMsg("No emails returned by AnyMailFinder for the provided domains.");
        setLoading(false);
        return;
      }

      // 3) NeverBounce verify (single request with all emails)
      const verify = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: allCandidates.map((c) => c.email) }),
      }).then((r) => r.json());

      const byEmail: Record<string, string> = verify?.results ?? {};

      // 4) Show results – put the domain in the “Company” column
      const withNB = allCandidates.map((c) => ({
        email: c.email,
        email_status: c.email_status,
        verified_status: byEmail[c.email],
        companyName: c.domain, // ResultsTable shows this under “Company”
      }));
      setRows(withNB);

      // 5) Save only 'valid' to Supabase, grouped by domain
      const valid = withNB.filter((x) => x.verified_status === "valid");
      if (valid.length) {
        // group by domain
        const byDomain = new Map<string, any[]>();
        for (const v of valid) {
          const d = v.companyName; // we stored domain here
          if (!byDomain.has(d)) byDomain.set(d, []);
          byDomain.get(d)!.push(v);
        }

        // import per domain
        for (const [domain, leads] of byDomain.entries()) {
          await fetch("/api/leads/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              domain,
              leads: leads.map((v) => ({
                ...v,
                source: "company",
                email_type,
                amf_email_status: v.email_status,
              })),
            }),
          });
          // brief delay between imports
          await new Promise((r) => setTimeout(r, 120));
        }

        setMsg(
          `Saved ${valid.length} valid email${valid.length > 1 ? "s" : ""} across ${byDomain.size} domain${byDomain.size > 1 ? "s" : ""}.`
        );
      } else {
        setMsg("No valid emails found.");
      }
    } catch (err: any) {
      console.error(err);
      setMsg("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold">Find All Emails at a Company</h1>

      <form onSubmit={onSubmit} className="space-y-4 bg-slate-50 p-6 rounded-lg border">
        {/* Dynamic domains */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Company Domain(s)</label>
          {domains.map((d, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
                placeholder={i === 0 ? "microsoft.com" : "anotherdomain.com"}
                value={d}
                onChange={(e) => updateDomain(i, e.target.value)}
              />
              {domains.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDomain(i)}
                  className="rounded-md border border-slate-300 px-3 text-sm hover:bg-slate-50"
                  aria-label="Remove domain"
                  title="Remove domain"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addDomain}
            className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50"
          >
            + Add another domain
          </button>
        </div>

        {/* Optional Email Type */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">
            Email Type <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            name="email_type"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
            placeholder="any, personal, generic"
          />
          <p className="text-xs text-slate-500">
            Leave blank for <span className="font-medium">any</span>.
          </p>
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-red-600 text-white px-4 py-2 font-medium hover:bg-red-700"
          disabled={loading}
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {msg && <div className="text-sm text-slate-600">{msg}</div>}
      <ResultsTable rows={rows} caption="Results" />
    </div>
  );
}
