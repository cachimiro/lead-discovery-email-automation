"use client";

interface Campaign {
  id: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
  started_at?: string;
  user_id: string;
}

interface Props {
  campaigns: Campaign[];
}

export default function CampaignsDebug({ campaigns }: Props) {
  const forceActive = async (campaign: Campaign) => {
    if (!confirm(`Force "${campaign.name}" to active status?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/force-active`, { 
        method: 'POST' 
      });
      const data = await res.json();
      
      if (data.success) {
        alert(`✅ Success! Campaign is now active.\n\nRefreshing page...`);
        window.location.reload();
      } else {
        alert(`❌ Failed: ${data.error}\n\n${JSON.stringify(data, null, 2)}`);
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  return (
    <details className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <summary className="cursor-pointer font-semibold text-yellow-900">
        🔍 Debug: Show Raw Campaign Data & Force Active
      </summary>
      <div className="mt-4 space-y-2">
        {campaigns.map((c) => (
          <div key={c.id} className="bg-white p-3 rounded border text-sm">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div><strong>Name:</strong> {c.name}</div>
                <div><strong>ID:</strong> <code className="text-xs bg-gray-100 px-1">{c.id}</code></div>
                <div>
                  <strong>Status:</strong>{' '}
                  <span className={`font-bold ${c.status === 'active' ? 'text-green-600' : c.status === 'draft' ? 'text-gray-600' : 'text-yellow-600'}`}>
                    {c.status}
                  </span>
                </div>
                <div><strong>Created:</strong> {new Date(c.created_at).toLocaleString()}</div>
                <div><strong>Updated:</strong> {new Date(c.updated_at).toLocaleString()}</div>
                {c.started_at && <div><strong>Started:</strong> {new Date(c.started_at).toLocaleString()}</div>}
              </div>
              {c.status !== 'active' && (
                <button
                  onClick={() => forceActive(c)}
                  className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                >
                  Force Active
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}
