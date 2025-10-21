import { getServerSession } from "next-auth";
import { authOptions } from "./auth-config";
import { redirect } from "next/navigation";

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getUser() {
  const session = await getSession();
  return session?.user || null;
}

export async function requireAuth() {
  // TEMPORARY: Skip auth for testing in development
  if (process.env.NODE_ENV === 'development') {
    return {
      id: "dev-user-123",
      email: "dev@test.com",
      name: "Dev User"
    };
  }
  
  const session = await getSession();
  if (!session || !session.user) {
    redirect("/login");
  }
  return session.user;
}
