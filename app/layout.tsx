import Sidebar from "@/components/sidebar";
import "./globals.css";

export const metadata = { title: "SwayPR – Lead Discovery" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen bg-white text-slate-900">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <main className="flex-1 p-8">{children}</main>
      </body>
    </html>
  );
}
