// app/api/discover/route.ts
import { NextRequest } from 'next/server';
import {
  amfFindPersonEmail,
  amfFindDecisionMakerEmail,
  amfFindAllEmailsAtCompany,
  amfFindEmailByLinkedInUrl,
} from '@/lib/anymailfinder';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const mode = String(body.mode ?? 'decision_maker');
    const webhookUrl: string | undefined = body.webhookUrl || undefined; // optional

    if (mode === 'person') {
      const res = await amfFindPersonEmail(
        {
          domain: body.domain,
          company_name: body.company_name,
          first_name: body.first_name,
          last_name: body.last_name,
          full_name: body.full_name,
        },
        { webhookUrl }
      );
      return Response.json(res);
    }

    if (mode === 'decision_maker') {
      const res = await amfFindDecisionMakerEmail(
        {
          decision_maker_category: body.decision_maker_category ?? ['ceo', 'marketing'],
          domain: body.domain,
          company_name: body.company_name,
        },
        { webhookUrl }
      );
      return Response.json(res);
    }

    if (mode === 'company') {
      const res = await amfFindAllEmailsAtCompany(
        {
          domain: body.domain,
          company_name: body.company_name,
          email_type: body.email_type ?? 'any',
        },
        { webhookUrl }
      );
      return Response.json(res);
    }

    if (mode === 'linkedin') {
      const res = await amfFindEmailByLinkedInUrl(
        { linkedin_url: body.linkedin_url },
        { webhookUrl }
      );
      return Response.json(res);
    }

    return Response.json({ error: 'Invalid mode' }, { status: 400 });
  } catch (err: any) {
    console.error('[discover]', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
