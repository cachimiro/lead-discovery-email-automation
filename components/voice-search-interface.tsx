// ============================================
// VOICE SEARCH INTERFACE - TEMPORARILY DISABLED
// This feature is being refined and will be re-enabled later
// Original code saved in git history
// ============================================

"use client";

interface VoiceSearchProps {
  onComplete: (data: any) => void;
}

export default function VoiceSearchInterface({ onComplete }: VoiceSearchProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-12 shadow-lg text-center">
      <div className="text-6xl mb-6">🚧</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Feature Temporarily Unavailable</h2>
      <p className="text-gray-600">
        AI Voice Search is being refined and will be available soon.
      </p>
    </div>
  );
}
