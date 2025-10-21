import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = supabaseAdmin();
    const body = await request.json();
    const { journalist_name, publication, subject, industry, deadline, linkedin_category, notes } = body;

    const { data, error } = await supabase
      .from("cold_outreach_journalist_leads")
      .insert({
        user_id: session.user.id,
        journalist_name,
        publication,
        subject,
        industry,
        deadline,
        linkedin_category,
        notes,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Lead ID required" }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const { error } = await supabase
      .from("cold_outreach_journalist_leads")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
