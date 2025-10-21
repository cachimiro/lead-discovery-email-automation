"use client";

interface SearchIndicatorProps {
  isSearching: boolean;
  currentDomain?: string;
  progress?: string;
}

export default function SearchIndicator({ isSearching, currentDomain, progress }: SearchIndicatorProps) {
  if (!isSearching) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-blue-600 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3 animate-pulse">
      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      <div>
        <div className="font-semibold">Searching for decision makers...</div>
        {currentDomain && <div className="text-sm text-blue-100">{currentDomain}</div>}
        {progress && <div className="text-xs text-blue-200 mt-1">{progress}</div>}
      </div>
    </div>
  );
}
