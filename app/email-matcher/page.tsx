import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import EmailMatcher from "@/components/email-matcher";

export default async function EmailMatcherPage() {
  const user = await requireAuth();
  const supabase = supabaseAdmin();

  // Get active leads (not expired)
  const { data: leads } = await supabase
    .from("cold_outreach_journalist_leads")
    .select("*")
    .eq("user_id", user.id)
    .gte("deadline", new Date().toISOString().split("T")[0])
    .eq("is_active", true)
    .order("deadline", { ascending: true });

  // Get all contacts
  const { data: contacts } = await supabase
    .from("cold_outreach_contacts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Get email templates
  const { data: templates } = await supabase
    .from("cold_outreach_email_templates")
    .select("*")
    .eq("user_id", user.id)
    .order("template_number");

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Match & Send Emails</h1>
        <p className="text-gray-600">
          Match your contacts with journalist opportunities and send personalized emails
        </p>
      </div>

      <EmailMatcher
        leads={leads || []}
        contacts={contacts || []}
        templates={templates || []}
        userId={user.id}
      />
    </div>
  );
}
