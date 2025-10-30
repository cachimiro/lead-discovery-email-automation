import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }

    const body = await request.json();
    const { email, name } = body;

    const supabase = supabaseAdmin();

    // Check if dev user exists
    let { data: user } = await supabase
      .from('cold_outreach_user_profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (!user) {
      // Create dev user with a fixed UUID (valid UUID format)
      const devUserId = '00000000-0000-0000-0000-000000000001';
      const { data: newUser, error } = await supabase
        .from('cold_outreach_user_profiles')
        .insert({
          id: devUserId,
          email,
          full_name: name,
        })
        .select()
        .single();

      if (error) {
        // If user already exists, just fetch it
        if (error.code === '23505') {
          const { data: existingUser } = await supabase
            .from('cold_outreach_user_profiles')
            .select('*')
            .eq('email', email)
            .single();
          user = existingUser;
        } else {
          throw error;
        }
      } else {
        user = newUser;
      }
    }

    // Create a simple session (not secure, dev only)
    const response = NextResponse.json({ success: true, user });
    
    // Set a simple cookie
    response.cookies.set('dev-user-id', user.id, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return response;

  } catch (error: any) {
    console.error('Dev login error:', error);
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
