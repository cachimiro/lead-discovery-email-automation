"use client";

import { useEffect, useState } from "react";

type Lead = {
  id: string;
  full_name: string | null;
  email: string;
  title: string | null;
  company_name: string | null;
  company_domain: string;
  neverbounce_result: string | null;
  created_at: string;
};

export default function LeadsPage() {
  const [items, setItems] = useState<Lead[]>([]);
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load(reset = true) {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (domain) params.set("domain", domain);
    if (!reset && nextCursor) params.set("cursor", nextCursor);

    const res = await fetch(`/api/leads?${params.toString()}`);
    const json = await res.json();
    setItems(prev => reset ? json.items : [...prev, ...json.items]);
    setNextCursor(json.nextCursor ?? null);
    setLoading(false);
  }

  useEffect(() => { load(true); /* initial */ }, []);

  async function onDelete(id: string) {
    if (!confirm("Delete this lead?")) return;
    await fetch(`/api/leads?id=${id}`, { method: "DELETE" });
    setItems(items.filter(i => i.id !== id));
  }

  const exportHref = `/api/leads/export?${new URLSearchParams({ query, domain }).toString()}`;

  return (
    <div className="space-y-4 max-w-5xl">
      <h1 className="text-xl font-semibold">Saved Leads</h1>

      <div className="flex gap-3">
        <input
          className="border border-slate-300 rounded-md px-3 py-2 text-sm w-64"
          placeholder="Search name, title, email"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <input
          className="border border-slate-300 rounded-md px-3 py-2 text-sm w-64"
          placeholder="Filter by domain (e.g. microsoft.com)"
          value={domain}
          onChange={e => setDomain(e.target.value)}
        />
        <button
          onClick={() => load(true)}
          className="rounded-md bg-red-600 text-white px-4 py-2 text-sm hover:bg-red-700"
          disabled={loading}
        >
          {loading ? "Loading…" : "Apply"}
        </button>
        <a
          href={exportHref}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
        >
          Export CSV
        </a>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-slate-200 rounded-lg overflow-hidden">
          <thead className="bg-slate-50">
            <tr className="text-left text-sm text-slate-600">
              <th className="px-3 py-2 border-b">Name</th>
              <th className="px-3 py-2 border-b">Title</th>
              <th className="px-3 py-2 border-b">Company</th>
              <th className="px-3 py-2 border-b">Domain</th>
              <th className="px-3 py-2 border-b">Email</th>
              <th className="px-3 py-2 border-b">NB</th>
              <th className="px-3 py-2 border-b"></th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {items.map(l => (
              <tr key={l.id} className="odd:bg-white even:bg-slate-50">
                <td className="px-3 py-2 border-b">{l.full_name ?? "—"}</td>
                <td className="px-3 py-2 border-b">{l.title ?? "—"}</td>
                <td className="px-3 py-2 border-b">{l.company_name ?? "—"}</td>
                <td className="px-3 py-2 border-b">{l.company_domain}</td>
                <td className="px-3 py-2 border-b font-mono">{l.email}</td>
                <td className="px-3 py-2 border-b">{l.neverbounce_result ?? ""}</td>
                <td className="px-3 py-2 border-b">
                  <button
                    onClick={() => onDelete(l.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && !loading && (
              <tr><td className="px-3 py-4 text-slate-500" colSpan={7}>No leads yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {nextCursor && (
        <button
          onClick={() => load(false)}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
          disabled={loading}
        >
          Load more
        </button>
      )}
    </div>
  );
}
