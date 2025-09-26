export type NbStatus = "valid" | "invalid" | "disposable" | "catchall" | "unknown" | string;


export async function nbVerifyEmail(email: string): Promise<NbStatus> {
const key = process.env.NEVERBOUNCE_API_KEY!;
const res = await fetch("https://api.neverbounce.com/v4/single/check", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ key, email })
});
if (!res.ok) throw new Error(`NeverBounce ${res.status}`);
const data = await res.json();
return data.result ?? data.verdict ?? data.status;
}