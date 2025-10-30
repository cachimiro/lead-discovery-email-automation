import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subject, publication, journalist_name } = body;

    if (!subject && !publication) {
      return NextResponse.json(
        { error: 'Subject or publication required' },
        { status: 400 }
      );
    }

    // Call OpenAI to detect industry
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured', industry: null, confidence: 'low' },
        { status: 200 }
      );
    }

    const prompt = `Based on the following information about a journalist lead, determine the PRIMARY industry category. Return ONLY a single word or short phrase (max 2-3 words) that best describes the industry.

Journalist: ${journalist_name || 'Unknown'}
Publication: ${publication || 'Unknown'}
Subject/Topic: ${subject || 'Unknown'}

Examples of good industry responses:
- Healthcare
- Technology
- Construction
- Retail
- Finance
- Food & Beverage
- Automotive
- Real Estate
- Education
- Entertainment
- Fashion
- Sports
- Travel
- Energy
- Manufacturing

Return ONLY the industry name, nothing else. If you cannot determine the industry with confidence, return "Unknown".`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using GPT-4o-mini until GPT-5-mini is available
        messages: [
          {
            role: 'system',
            content: 'You are an expert at categorizing business and media topics into industry categories for Sway PR, a Manchester-based PR agency. Always respond with a single industry name only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 20,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      return NextResponse.json(
        { error: 'Failed to detect industry', industry: null, confidence: 'low' },
        { status: 200 }
      );
    }

    const data = await response.json();
    const detectedIndustry = data.choices[0]?.message?.content?.trim() || 'Unknown';

    // Determine confidence based on response
    const confidence = detectedIndustry.toLowerCase() === 'unknown' ? 'low' : 'high';

    return NextResponse.json({
      industry: detectedIndustry === 'Unknown' ? null : detectedIndustry,
      confidence,
      success: true
    });

  } catch (error: any) {
    console.error('Error detecting industry:', error);
    return NextResponse.json(
      { error: error.message, industry: null, confidence: 'low' },
      { status: 200 }
    );
  }
}
