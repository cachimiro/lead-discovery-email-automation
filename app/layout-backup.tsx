import Sidebar from "@/components/sidebar";
import NextAuthSessionProvider from "@/components/session-provider";
import { getUser } from "@/lib/auth";
import "./globals.css";

export const metadata = { 
  title: "SwayPR – Premium Lead Discovery",
  description: "AI-Powered Email Discovery & Outreach Platform"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="flex min-h-screen bg-[#F9FAFB] text-[#111827] antialiased">
        <NextAuthSessionProvider>
          {user && <Sidebar />}
          <main className={user ? "flex-1 p-8 page-transition" : "flex-1 page-transition"}>
            {children}
          </main>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}
