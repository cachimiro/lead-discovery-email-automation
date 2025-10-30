import { getServerSession } from "next-auth";
import { authOptions } from "./auth-config";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

const DEV_USER = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "dev@test.com",
  name: "Dev User"
};

export async function getSession() {
  // First try to get NextAuth session
  const session = await getServerSession(authOptions);
  if (session) {
    return session;
  }

  // Fallback to dev cookie in development
  if (process.env.NODE_ENV === 'development') {
    const cookieStore = await cookies();
    const devUserId = cookieStore.get('dev-user-id')?.value;
    if (devUserId) {
      return { user: { ...DEV_USER, id: devUserId } };
    }
  }

  return null;
}

export async function getUser() {
  const session = await getSession();
  return session?.user || null;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session || !session.user) {
    redirect("/login");
  }
  return session.user;
}
