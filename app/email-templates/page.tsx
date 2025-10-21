import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import EmailTemplateForm from "@/components/email-template-form";

export default async function EmailTemplatesPage() {
  const user = await requireAuth();
  const supabase = supabaseAdmin();

  const { data: templates } = await supabase
    .from("cold_outreach_email_templates")
    .select("*")
    .eq("user_id", user.id)
    .order("template_number");

  const templatesByNumber = {
    1: templates?.find((t) => t.template_number === 1),
    2: templates?.find((t) => t.template_number === 2),
    3: templates?.find((t) => t.template_number === 3),
  };

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Templates</h1>
        <p className="text-gray-600">
          Create and manage your email outreach templates
        </p>
      </div>

      <div className="space-y-8">
        {[1, 2, 3].map((num) => (
          <div
            key={num}
            className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm"
          >
            <h2 className="mb-6 text-xl font-semibold text-gray-900">
              Email Outreach #{num}
            </h2>
            <EmailTemplateForm
              templateNumber={num}
              existingTemplate={templatesByNumber[num as keyof typeof templatesByNumber]}
              userId={user.id}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
