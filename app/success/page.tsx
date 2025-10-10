// app/success/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

export default function SuccessPage() {
  const sp = useSearchParams();
  const batch = sp.get("batch");

  const exportHref = useMemo(() => {
    if (!batch) return "#";
    return `/api/leads/export?batch=${encodeURIComponent(batch)}`;
  }, [batch]);

  return (
    <main className="max-w-xl mx-auto p-8 space-y-4">
      <h1 className="text-2xl font-semibold">Payment successful 🎉</h1>
      <p className="text-slate-600">
        Your verified leads have been saved. You can download a CSV copy below.
      </p>

      {batch ? (
        <a
          href={exportHref}
          className="inline-flex items-center rounded-md bg-red-600 text-white px-4 py-2 font-medium hover:bg-red-700"
        >
          Download CSV
        </a>
      ) : (
        <p className="text-slate-500">No batch id found in the URL.</p>
      )}

      <div className="pt-4">
        <a href="/" className="text-red-700 hover:underline">
          Back to Home
        </a>
      </div>
    </main>
  );
}
