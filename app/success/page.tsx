// app/success/page.tsx
"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

export const dynamic = "force-dynamic"; // don’t prerender this page

function SuccessInner() {
  const sp = useSearchParams();
  const batch = sp.get("batch");

  const exportHref = useMemo(() => {
    if (!batch) return "#";
    return `/api/leads/export?batch=${encodeURIComponent(batch)}`;
  }, [batch]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Payment successful 🎉</h1>
      <p className="text-gray-600 text-lg">
        Your verified leads have been saved and are ready to view.
      </p>

      <div className="flex gap-4">
        <a
          href="/discovered-leads"
          className="inline-flex items-center rounded-xl bg-blue-600 text-white px-6 py-3 font-medium hover:bg-blue-700 transition-colors"
        >
          View Your Leads
        </a>
        {batch && (
          <a
            href={exportHref}
            className="inline-flex items-center rounded-xl bg-gray-600 text-white px-6 py-3 font-medium hover:bg-gray-700 transition-colors"
          >
            Download CSV
          </a>
        )}
      </div>

      <div className="pt-4">
        <a href="/discover" className="text-blue-600 hover:underline font-medium">
          Discover More Leads
        </a>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <main className="max-w-xl mx-auto p-8">
      <Suspense fallback={<p className="text-slate-600">Loading…</p>}>
        <SuccessInner />
      </Suspense>
    </main>
  );
}
