import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = supabaseAdmin();
    const body = await request.json();
    const { first_name, last_name, email, publication, subject, industry, deadline, linkedin_category, notes } = body;

    // Combine first_name and last_name into journalist_name
    const journalist_name = `${first_name || ''} ${last_name || ''}`.trim();

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
        notes: notes || email, // Store email in notes if provided
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = supabaseAdmin();
    const body = await request.json();
    const { 
      id, 
      journalist_name, 
      publication, 
      subject, 
      industry, 
      deadline, 
      linkedin_category, 
      notes,
      is_active 
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Lead ID required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("cold_outreach_journalist_leads")
      .update({
        journalist_name,
        publication,
        subject,
        industry,
        deadline,
        linkedin_category,
        notes,
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .eq("user_id", session.user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();

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
