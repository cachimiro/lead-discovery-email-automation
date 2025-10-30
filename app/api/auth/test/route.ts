import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    nextauth_url: process.env.NEXTAUTH_URL,
    nextauth_secret_set: !!process.env.NEXTAUTH_SECRET,
    google_client_id: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...',
    google_client_secret_set: !!process.env.GOOGLE_CLIENT_SECRET,
    microsoft_client_id: process.env.MICROSOFT_CLIENT_ID?.substring(0, 20) + '...',
    microsoft_client_secret_set: !!process.env.MICROSOFT_CLIENT_SECRET,
    microsoft_tenant_id: process.env.MICROSOFT_TENANT_ID,
    node_env: process.env.NODE_ENV,
  });
}
