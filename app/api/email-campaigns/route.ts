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
    const { campaigns } = body;

    if (!Array.isArray(campaigns) || campaigns.length === 0) {
      return NextResponse.json({ error: "Campaigns array required" }, { status: 400 });
    }

    // Add user_id to each campaign
    const campaignsWithUser = campaigns.map((c) => ({
      ...c,
      user_id: session.user.id,
      status: "draft",
    }));

    const { data, error } = await supabase
      .from("cold_outreach_email_campaigns")
      .insert(campaignsWithUser)
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, count: data.length, campaigns: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = supabaseAdmin();

    const { data, error } = await supabase
      .from("cold_outreach_email_campaigns")
      .select(`
        *,
        cold_outreach_journalist_leads (*),
        cold_outreach_contacts (*)
      `)
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
