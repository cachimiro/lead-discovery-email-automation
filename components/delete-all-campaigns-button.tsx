"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteAllCampaignsButton() {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAll = async () => {
    if (!confirm("Are you sure you want to delete ALL campaigns? This action cannot be undone.")) {
      return;
    }

    if (!confirm("This will permanently delete all your campaigns. Are you absolutely sure?")) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch("/api/campaigns/delete-all", {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete campaigns");

      alert("All campaigns deleted successfully");
      window.location.reload();
    } catch (error) {
      alert("Failed to delete campaigns. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDeleteAll}
      disabled={deleting}
      className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {deleting ? "Deleting..." : "Delete All Campaigns"}
    </button>
  );
}
