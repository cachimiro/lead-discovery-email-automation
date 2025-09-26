import { NextRequest } from "next/server";
import { nbVerifyEmail } from "@/lib/neverbounce";


export async function POST(req: NextRequest) {
const { emails } = await req.json();
if (!Array.isArray(emails) || emails.length === 0) {
return Response.json({ error: "emails[] required" }, { status: 400 });
}
const results: Record<string, string> = {};
for (const e of emails) {
try {
const r = await nbVerifyEmail(e);
results[e] = r;
} catch {
results[e] = "error";
}
}
return Response.json({ results });
}