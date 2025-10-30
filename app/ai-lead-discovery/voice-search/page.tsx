// ============================================
// VOICE SEARCH PAGE - TEMPORARILY DISABLED
// This feature is being refined and will be re-enabled later
// ============================================

"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function VoiceSearchPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🚧</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Feature Temporarily Unavailable</h1>
        <p className="text-gray-600 mb-6">
          AI Voice Search is being refined and will be available soon. In the meantime, you can use Manual Lead Discovery.
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
// To restore: git show HEAD~1:app/ai-lead-discovery/voice-search/page.tsx
// ============================================
