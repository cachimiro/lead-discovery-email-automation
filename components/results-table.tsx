"use client";


type Row = {
fullName?: string | null;
email: string;
title?: string | null;
companyName?: string | null;
email_status?: string; // from AMF
verified_status?: string; // from NB: valid/invalid/etc
};


export default function ResultsTable({ rows, caption }: { rows: Row[]; caption?: string }) {
if (!rows?.length) return null;
return (
<div className="mt-6 overflow-x-auto">
{caption && <div className="mb-2 text-sm text-slate-600">{caption}</div>}
<table className="min-w-full border border-slate-200 rounded-lg overflow-hidden">
<thead className="bg-slate-50">
<tr className="text-left text-sm text-slate-600">
<th className="px-3 py-2 border-b">Name</th>
<th className="px-3 py-2 border-b">Title</th>
<th className="px-3 py-2 border-b">Company</th>
<th className="px-3 py-2 border-b">Email</th>
<th className="px-3 py-2 border-b">AMF</th>
<th className="px-3 py-2 border-b">NeverBounce</th>
</tr>
</thead>
<tbody className="text-sm">
{rows.map((r, i) => (
<tr key={i} className="odd:bg-white even:bg-slate-50">
<td className="px-3 py-2 border-b">{r.fullName ?? "—"}</td>
<td className="px-3 py-2 border-b">{r.title ?? "—"}</td>
<td className="px-3 py-2 border-b">{r.companyName ?? "—"}</td>
<td className="px-3 py-2 border-b font-mono">{r.email}</td>
<td className="px-3 py-2 border-b">{r.email_status ?? ""}</td>
<td className="px-3 py-2 border-b">{r.verified_status ?? ""}</td>
</tr>
))}
</tbody>
</table>
</div>
);
}