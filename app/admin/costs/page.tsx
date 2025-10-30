import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export default async function AdminCostsPage() {
  const user = await requireAuth();
  const supabase = supabaseAdmin();

  // Get all search sessions
  const { data: sessions } = await supabase
    .from('cold_outreach_ai_search_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Get all costs
  const { data: costs } = await supabase
    .from('cold_outreach_cost_to_bill')
    .select('*')
    .eq('user_id', user.id)
    .order('incurred_at', { ascending: false });

  // Calculate totals
  const totalCostCents = costs?.reduce((sum, cost) => sum + cost.cost_cents, 0) || 0;
  const totalBillableCents = costs?.reduce((sum, cost) => sum + cost.billable_cents, 0) || 0;
  const totalTokensInput = costs?.reduce((sum, cost) => sum + (cost.tokens_input || 0), 0) || 0;
  const totalTokensOutput = costs?.reduce((sum, cost) => sum + (cost.tokens_output || 0), 0) || 0;

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Cost & Usage Dashboard</h1>
        <p className="text-gray-600">
          Track API usage and costs for AI lead discovery
        </p>
      </div>

      {/* Pricing Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-3">💰 Pricing Model (5% Profit Margin)</h3>
        <div className="mb-3 text-xs text-blue-700 italic">
          Currently using GPT-4o (will transition to GPT-5 when available)
        </div>
        <div className="grid gap-4 md:grid-cols-3 text-sm">
          <div>
            <div className="font-semibold text-blue-900 mb-1">GPT-4o (Current)</div>
            <div className="text-blue-700">Input: $2.50/1M tokens</div>
            <div className="text-blue-700">Output: $10.00/1M tokens</div>
          </div>
          <div>
            <div className="font-semibold text-blue-900 mb-1">GPT-4o-mini</div>
            <div className="text-blue-700">Input: $0.15/1M tokens</div>
            <div className="text-blue-700">Output: $0.60/1M tokens</div>
          </div>
          <div>
            <div className="font-semibold text-blue-900 mb-1">Email Validation</div>
            <div className="text-blue-700">~$0.008 per email</div>
            <div className="text-blue-700">(NeverBounce)</div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="text-sm text-gray-600 mb-1">Total Searches</div>
          <div className="text-3xl font-bold text-gray-900">{sessions?.length || 0}</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="text-sm text-gray-600 mb-1">Total Cost</div>
          <div className="text-3xl font-bold text-gray-900">
            ${(totalCostCents / 100).toFixed(2)}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="text-sm text-gray-600 mb-1">Total Billable</div>
          <div className="text-3xl font-bold text-blue-600">
            ${(totalBillableCents / 100).toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            +${((totalBillableCents - totalCostCents) / 100).toFixed(2)} profit
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="text-sm text-gray-600 mb-1">Total Tokens</div>
          <div className="text-2xl font-bold text-gray-900">
            {((totalTokensInput + totalTokensOutput) / 1000).toFixed(1)}K
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {(totalTokensInput / 1000).toFixed(1)}K in / {(totalTokensOutput / 1000).toFixed(1)}K out
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Recent Search Sessions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700 uppercase">Date</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700 uppercase">Industry</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700 uppercase">Location</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700 uppercase">Status</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-700 uppercase">Leads Found</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sessions?.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(session.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{session.industry || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{session.location || '—'}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      session.status === 'completed' ? 'bg-green-100 text-green-800' :
                      session.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {session.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">
                    {session.leads_created || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Cost Breakdown by Service</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700 uppercase">Date</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700 uppercase">Service</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700 uppercase">Type</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-700 uppercase">API Calls</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-700 uppercase">Tokens</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-700 uppercase">Cost</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-700 uppercase">Billable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {costs?.map((cost) => (
                <tr key={cost.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(cost.incurred_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{cost.service_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{cost.service_type}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">{cost.api_calls}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">
                    {cost.tokens_input || cost.tokens_output ? 
                      `${((cost.tokens_input + cost.tokens_output) / 1000).toFixed(1)}K` : 
                      '—'
                    }
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">
                    ${(cost.cost_cents / 100).toFixed(4)}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-blue-600 text-right">
                    ${(cost.billable_cents / 100).toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
