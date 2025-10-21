"use client";

import { useSearch } from "@/contexts/search-context";
import Link from "next/link";

export default function GlobalSearchIndicator() {
  const { searchState, cancelSearch } = useSearch();

  if (!searchState.isSearching) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-blue-600 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-sm">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0 mt-0.5"></div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">Searching for decision makers...</div>
          {searchState.currentDomain && (
            <div className="text-sm text-blue-100 mt-1 truncate">{searchState.currentDomain}</div>
          )}
          {searchState.progress && (
            <div className="text-xs text-blue-200 mt-1">Progress: {searchState.progress}</div>
          )}
          <div className="flex gap-2 mt-3">
            <Link
              href="/discover"
              className="text-xs bg-white text-blue-600 px-3 py-1 rounded hover:bg-blue-50 transition-colors"
            >
              View Results
            </Link>
            <button
              onClick={cancelSearch}
              className="text-xs bg-blue-700 text-white px-3 py-1 rounded hover:bg-blue-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
