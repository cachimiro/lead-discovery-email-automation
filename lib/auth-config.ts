import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AzureADProvider from "next-auth/providers/azure-ad";
import { supabaseAdmin } from "./supabase";
import { createHash } from "crypto";

// Generate a consistent UUID v5 from OAuth provider ID
function generateUuidFromOAuthId(oauthId: string): string {
  // Use MD5 hash to create a consistent UUID-like string
  const hash = createHash('md5').update(oauthId).digest('hex');
  // Format as UUID v4
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid profile email https://www.googleapis.com/auth/gmail.send"
        }
      }
    }),
    AzureADProvider({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: process.env.MICROSOFT_TENANT_ID!,
      authorization: {
        params: {
          scope: "openid profile email User.Read Mail.Send"
        }
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;

      try {
        const supabase = supabaseAdmin();
        
        // Generate consistent UUID from OAuth ID
        const userId = generateUuidFromOAuthId(user.id);
        
        // Check if user exists in cold_outreach_user_profiles
        const { data: existingUser } = await supabase
          .from("cold_outreach_user_profiles")
          .select("id")
          .eq("email", user.email)
          .single();

        if (!existingUser) {
          // Create new user profile with generated UUID
          await supabase.from("cold_outreach_user_profiles").insert({
            id: userId,
            email: user.email,
            full_name: user.name,
            avatar_url: user.image,
          });
        } else {
          // Update existing user profile
          await supabase
            .from("cold_outreach_user_profiles")
            .update({
              full_name: user.name,
              avatar_url: user.image,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingUser.id);
        }

        // Store OAuth tokens for email sending
        if (account?.access_token) {
          const provider = account.provider === 'google' ? 'google' : 'microsoft';
          
          await supabase
            .from("cold_outreach_oauth_tokens")
            .upsert({
              user_id: existingUser?.id || userId,
              provider: provider,
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              token_type: account.token_type || 'Bearer',
              expires_at: account.expires_at ? new Date(account.expires_at * 1000).toISOString() : null,
              scope: account.scope,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id,provider'
            });
        }

        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        // Use the generated UUID
        session.user.id = generateUuidFromOAuthId(token.sub);
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};
