import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = supabaseAdmin();

    const { data: contacts, error } = await supabase
      .from("cold_outreach_contacts")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, contacts: contacts || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = supabaseAdmin();

    const body = await request.json();
    const { email, first_name, last_name, company, title, industry, notes, categories } = body;

    // Optional: Validate email using NeverBounce API
    let emailStatus = 'unknown';
    let isValid = true;
    
    if (process.env.NEVERBOUNCE_API_KEY && email) {
      try {
        const nbResponse = await fetch(
          `https://api.neverbounce.com/v4/single/check?key=${process.env.NEVERBOUNCE_API_KEY}&email=${encodeURIComponent(email)}`
        );
        const nbData = await nbResponse.json();
        
        if (nbData.status === 'success') {
          emailStatus = nbData.result; // valid, invalid, disposable, catchall, unknown
          isValid = emailStatus === 'valid';
        }
      } catch (error) {
        console.error('Email validation error:', error);
        // Continue without validation
      }
    }

    const { data, error } = await supabase
      .from("cold_outreach_contacts")
      .insert({
        user_id: session.user.id,
        email,
        first_name,
        last_name,
        company,
        title,
        industry,
        notes,
        categories: categories || [],
        email_status: emailStatus,
        is_valid: isValid,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { success: false, error: "This email already exists in your contacts" },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true, contact: data });
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
    const { id, email, first_name, last_name, company, title, industry, notes, categories } = body;

    if (!id) {
      return NextResponse.json({ error: "Contact ID required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("cold_outreach_contacts")
      .update({
        email,
        first_name,
        last_name,
        company,
        title,
        industry,
        notes,
        categories: categories || [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", session.user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, contact: data });
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

    const supabase = supabaseAdmin();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Contact ID required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("cold_outreach_contacts")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
