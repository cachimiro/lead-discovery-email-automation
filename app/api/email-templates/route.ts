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
    const { 
      template_number, 
      subject, 
      body: emailBody,
      sender_name,
      sender_email,
      include_thread,
      is_enabled,
      description
    } = body;

    const { data, error } = await supabase
      .from("cold_outreach_email_templates")
      .insert({
        user_id: session.user.id,
        template_number,
        subject,
        body: emailBody,
        sender_name: sender_name || "Mark Hayward",
        sender_email: sender_email || "mark@swaypr.com",
        include_thread: include_thread ?? true,
        is_enabled: is_enabled ?? true,
        description: description || null,
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
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = supabaseAdmin();

    const body = await request.json();
    const { 
      id, 
      subject, 
      body: emailBody,
      sender_name,
      sender_email,
      include_thread,
      is_enabled,
      description
    } = body;

    const { data, error} = await supabase
      .from("cold_outreach_email_templates")
      .update({
        subject,
        body: emailBody,
        sender_name,
        sender_email,
        include_thread,
        is_enabled,
        description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", session.user.id)
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

    const supabase = supabaseAdmin();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Template ID required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("cold_outreach_email_templates")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
