"use client";
import { useState } from "react";
import FormField from "@/components/form-field";
import ResultsTable from "@/components/results-table";

function inferDomainFromEmail(email?: string) {
  if (!email) return undefined;
  const at = email.indexOf("@");
  return at > -1 ? email.slice(at + 1) : undefined;
}

export default function LinkedInPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setRows([]);
    setMsg(null);
    setLoading(true);

    try {
      const form = new FormData(e.currentTarget);
      const linkedin_url = (form.get("linkedin_url") as string)?.trim();

      // 1) AMF
      const amf = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "linkedin", linkedin_url }),
      }).then((r) => r.json());

      // 2) Candidates
      const candidates: any[] = [];
      if (amf?.email) {
        candidates.push({
          email: amf.email,
          email_status: amf.email_status,
          fullName: amf.person_full_name,
          title: amf.person_job_title,
          companyName: amf.person_company_name,
        });
      }

      if (candidates.length === 0) {
        setMsg("No emails returned by AnyMailFinder.");
        setLoading(false);
        return;
      }

      // 3) NeverBounce verify
      const verify = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: candidates.map((c) => c.email) }),
      }).then((r) => r.json());

      const byEmail: Record<string, string> = verify?.results ?? {};
      const withNB = candidates.map((c) => ({ ...c, verified_status: byEmail[c.email] }));
      setRows(withNB);

      // 4) Save only 'valid'
      const valid = withNB.filter((x) => x.verified_status === "valid");
      if (valid.length) {
        const inferredDomain = inferDomainFromEmail(valid[0]?.email);
        await fetch("/api/leads/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            domain: inferredDomain || "", // fallback from email
            leads: valid.map((v) => ({
              ...v,
              source: "linkedin",
              linkedin_url,
              amf_email_status: v.email_status,
            })),
          }),
        });
        setMsg(`${valid.length} valid lead${valid.length > 1 ? "s" : ""} saved.`);
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
    <div className="max-w-xl space-y-6">
      <h1 className="text-xl font-semibold">Find Emails by LinkedIn URL</h1>
      <form onSubmit={onSubmit} className="space-y-4 bg-slate-50 p-6 rounded-lg border">
        <FormField
          label="LinkedIn Profile URL"
          name="linkedin_url"
          placeholder="https://www.linkedin.com/in/username/"
        />
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
