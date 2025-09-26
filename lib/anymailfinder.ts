// lib/anymailfinder.ts
// AnyMailFinder v5.1 wrappers for: person, decision-maker, company, linkedin-url
// Usage assumes Next.js/Node 18+ (fetch available). If you're on Node <18, bring a fetch polyfill.

export type AmfEmailStatus = 'valid' | 'risky' | 'not_found' | 'blacklisted';

const AMF_BASE = 'https://api.anymailfinder.com/v5.1';
const API_KEY = process.env.AMF_API_KEY!;
if (!API_KEY) console.warn('[AMF] Missing AMF_API_KEY');

type FetchOpts = {
  body: Record<string, any>;
  webhookUrl?: string; // optional: AMF will POST result to this URL if provided
};

async function amfPOST<T>(path: string, { body, webhookUrl }: FetchOpts): Promise<T> {
  // NOTE: If your AMF account expects a different auth header (e.g., Basic or X-Api-Key),
  // adjust here. Many setups accept Bearer:
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`,
  };
  if (webhookUrl) headers['x-webhook-url'] = webhookUrl;

  let attempt = 0;
  while (true) {
    const res = await fetch(`${AMF_BASE}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (res.ok) return (await res.json()) as T;

    // Simple retry on rate limit / transient errors
    if (res.status === 429 || res.status >= 500) {
      if (attempt >= 2) {
        const text = await res.text().catch(() => '');
        throw new Error(`[AMF] ${res.status} after retries: ${text}`);
      }
      await new Promise(r => setTimeout(r, 500 * 2 ** attempt));
      attempt++;
      continue;
    }

    const text = await res.text().catch(() => '');
    throw new Error(`[AMF] ${res.status} ${res.statusText}: ${text}`);
  }
}

/* -------------------------
   1) Find a Person's Email
-------------------------- */
export type AmfFindPersonReq = {
  domain?: string;          // preferred
  company_name?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;       // alt to first+last
};
export type AmfFindPersonRes = {
  email: string | null;
  email_status: AmfEmailStatus;
  input?: any;
};

export async function amfFindPersonEmail(
  params: AmfFindPersonReq,
  opts?: { webhookUrl?: string }
): Promise<AmfFindPersonRes> {
  // validation guardrails (AMF also enforces)
  if (!((params.full_name || (params.first_name && params.last_name)))) {
    throw new Error('AMF person: provide full_name OR first_name+last_name');
  }
  if (!(params.domain || params.company_name)) {
    throw new Error('AMF person: provide domain OR company_name');
  }

  return amfPOST<AmfFindPersonRes>('/find-email/person', {
    body: params,
    webhookUrl: opts?.webhookUrl,
  });
}

/* ---------------------------------
   2) Find a Decision Maker's Email
---------------------------------- */
export type AmfDecisionCategory =
  | 'ceo' | 'engineering' | 'finance' | 'hr' | 'it'
  | 'logistics' | 'marketing' | 'operations' | 'buyer' | 'sales';

export type AmfFindDecisionReq = {
  decision_maker_category: AmfDecisionCategory[]; // one or more, ordered by priority
  domain?: string;                                 // preferred
  company_name?: string;
};
export type AmfFindDecisionRes = {
  email: string | null;
  email_status: AmfEmailStatus;
  person_full_name: string | null;
  person_job_title: string | null;
  person_linkedin_url: string | null;
  input?: any;
};

export async function amfFindDecisionMakerEmail(
  params: AmfFindDecisionReq,
  opts?: { webhookUrl?: string }
): Promise<AmfFindDecisionRes> {
  if (!params.decision_maker_category?.length) {
    throw new Error('AMF decision-maker: provide at least one decision_maker_category');
  }
  if (!(params.domain || params.company_name)) {
    throw new Error('AMF decision-maker: provide domain OR company_name');
  }

  return amfPOST<AmfFindDecisionRes>('/find-email/decision-maker', {
    body: params,
    webhookUrl: opts?.webhookUrl,
  });
}

/* ------------------------------
   3) Find All Emails at Company
------------------------------- */
export type AmfFindCompanyReq = {
  domain?: string;          // preferred
  company_name?: string;
  email_type?: 'any' | 'generic' | 'personal';
};
export type AmfFindCompanyRes = {
  emails: string[];         // up to 20
  email_status: AmfEmailStatus; // applies to entire set
  input?: any;
};

export async function amfFindAllEmailsAtCompany(
  params: AmfFindCompanyReq,
  opts?: { webhookUrl?: string }
): Promise<AmfFindCompanyRes> {
  if (!(params.domain || params.company_name)) {
    throw new Error('AMF company: provide domain OR company_name');
  }

  return amfPOST<AmfFindCompanyRes>('/find-email/company', {
    body: params,
    webhookUrl: opts?.webhookUrl,
  });
}

/* --------------------------------
   4) Find Email by LinkedIn URL
--------------------------------- */
export type AmfFindByLinkedInReq = {
  linkedin_url: string; // e.g. https://www.linkedin.com/in/...
};
export type AmfFindByLinkedInRes = {
  email: string | null;
  email_status: AmfEmailStatus;
  person_company_name: string | null;
  person_full_name: string | null;
  person_job_title: string | null;
  input?: any;
};

export async function amfFindEmailByLinkedInUrl(
  params: AmfFindByLinkedInReq,
  opts?: { webhookUrl?: string }
): Promise<AmfFindByLinkedInRes> {
  if (!params.linkedin_url) throw new Error('AMF LinkedIn: linkedin_url is required');

  return amfPOST<AmfFindByLinkedInRes>('/find-email/linkedin-url', {
    body: params,
    webhookUrl: opts?.webhookUrl,
  });
}

/* --------------------
   Little utilities
--------------------- */
export function isAmfDeliverable(status: AmfEmailStatus) {
  // We’ll still push to NeverBounce, but this helps with UI copy.
  return status === 'valid';
}
