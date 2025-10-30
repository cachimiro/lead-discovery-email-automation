// ============================================
// AI LEAD DISCOVERY PAGE - TEMPORARILY DISABLED
// This feature is being refined and will be re-enabled later
// ============================================

import { requireAuth } from "@/lib/auth";
import Link from "next/link";

export default async function AILeadDiscoveryPage() {
  const user = await requireAuth();

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🚧</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Feature Temporarily Unavailable</h1>
        <p className="text-gray-600 mb-6">
          AI Lead Discovery is being refined and will be available soon. In the meantime, you can use Manual Lead Discovery.
        </p>
        <Link
          href="/discover"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          Go to Manual Lead Discovery
        </Link>
      </div>
    </div>
  );
}

// ============================================
// ORIGINAL CODE REMOVED - SAVED IN GIT HISTORY
// To restore: git show HEAD~1:app/ai-lead-discovery/page.tsx
// ============================================
