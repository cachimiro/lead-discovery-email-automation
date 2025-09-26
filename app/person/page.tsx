"use client";
import { useState } from "react";
import FormField from "@/components/form-field";
import ResultsTable from "@/components/results-table";

function inferDomainFromEmail(email?: string) {
  if (!email) return undefined;
  const at = email.indexOf("@");
  return at > -1 ? email.slice(at + 1) : undefined;
}

export default function PersonPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setRows([]);
    setLoading(true);

    try {
      const form = new FormData(e.currentTarget);
      const payload = {
        mode: "person" as const,
        domain: (form.get("domain") as string | undefined)?.trim(),
        company_name: (form.get("company_name") as string | undefined)?.trim(),
        first_name: (form.get("first_name") as string | undefined)?.trim(),
        last_name: (form.get("last_name") as string | undefined)?.trim(),
        full_name: (form.get("full_name") as string | undefined)?.trim(),
      };

      // 1) AMF
      const amf = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then((r) => r.json());

      // 2) Candidates
      const candidates: any[] = [];
      if (amf?.email) {
        candidates.push({
          email: amf.email,
          email_status: amf.email_status,
          fullName:
            amf.person_full_name ??
            payload.full_name ??
            `${payload.first_name ?? ""} ${payload.last_name ?? ""}`.trim(),
          title: amf.person_job_title ?? undefined,
          companyName: payload.company_name,
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
        const fallbackDomain =
          payload.domain || inferDomainFromEmail(valid[0]?.email) || payload.company_name || "";

        await fetch("/api/leads/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            domain: fallbackDomain,
            leads: valid.map((v) => ({
              ...v,
              source: "person",
              amf_email_status: v.email_status,
              firstName: payload.first_name,
              lastName: payload.last_name,
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
      <h1 className="text-xl font-semibold">Find a Person&apos;s Email</h1>
      <form onSubmit={onSubmit} className="space-y-4 bg-slate-50 p-6 rounded-lg border">
        <FormField label="Full Name (or First + Last)" name="full_name" placeholder="John Doe" />
        <div className="grid grid-cols-2 gap-4">
          <FormField label="First Name" name="first_name" placeholder="John" />
          <FormField label="Last Name" name="last_name" placeholder="Doe" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Company Domain" name="domain" placeholder="microsoft.com" />
          <FormField label="Company Name" name="company_name" placeholder="Microsoft" />
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
