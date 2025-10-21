import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";

export default async function DiscoveredLeadsPage() {
  const user = await requireAuth();
  const supabase = supabaseAdmin();

  const { data: leads, error } = await supabase
    .from("cold_outreach_discovered_leads")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching leads:", error);
  }

  const validLeads = leads?.filter((lead) => lead.nb_status === "valid") || [];
  const totalLeads = leads?.length || 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Discovered Leads</h1>
          <p className="text-gray-600">
            All verified email leads from your discovery searches
          </p>
        </div>
        <Link
          href="/discover"
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          Discover More Leads
        </Link>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {validLeads.length}
          </div>
          <div className="text-gray-600 font-medium">Valid Leads</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {totalLeads}
          </div>
          <div className="text-gray-600 font-medium">Total Leads</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {leads?.filter((l) => l.source === "linkedin").length || 0}
          </div>
          <div className="text-gray-600 font-medium">From LinkedIn</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
        <div className="border-b border-gray-100 pb-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Your Discovered Leads</h2>
        </div>

        {!leads || leads.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No leads discovered yet</p>
            <Link
              href="/discover"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              Start Discovering Leads
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Title</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Company</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Domain</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Source</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{lead.email}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {lead.full_name || `${lead.first_name || ""} ${lead.last_name || ""}`.trim() || "-"}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{lead.title || "-"}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{lead.company_name || "-"}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{lead.company_domain || "-"}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          lead.nb_status === "valid"
                            ? "bg-green-100 text-green-800"
                            : lead.nb_status === "invalid"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {lead.nb_status || "unknown"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 capitalize">{lead.source || "-"}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
