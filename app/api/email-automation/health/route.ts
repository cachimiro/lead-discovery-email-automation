/**
 * HEALTH CHECK ENDPOINT
 * 
 * Provides real-time system health status and metrics
 */

import { NextResponse } from 'next/server';
import { performHealthCheck, generateDailyReport } from '@/lib/email-automation/monitoring';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    
    const health = await performHealthCheck();
    
    if (format === 'report') {
      const report = await generateDailyReport();
      return new NextResponse(report, {
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    return NextResponse.json(health);
    
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
