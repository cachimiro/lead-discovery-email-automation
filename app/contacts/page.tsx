import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import ContactsList from "@/components/contacts-list";
import AddContactForm from "@/components/add-contact-form";

export default async function ContactsPage() {
  const user = await requireAuth();
  const supabase = supabaseAdmin();

  const { data: contacts, error } = await supabase
    .from("cold_outreach_contacts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Database</h1>
        <p className="text-gray-600">
          Manage your personal contact list for email outreach
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
        <h2 className="mb-6 text-xl font-semibold text-gray-900">Add New Contact</h2>
        <AddContactForm userId={user.id} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
        <div className="border-b border-gray-100 pb-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Your Contacts</h2>
          <p className="mt-2 text-gray-600">
            <span className="text-2xl font-bold text-gray-900">{contacts?.length || 0}</span> contact{contacts?.length !== 1 ? "s" : ""} in your database
          </p>
        </div>
        <ContactsList contacts={contacts || []} />
      </div>
    </div>
  );
}
