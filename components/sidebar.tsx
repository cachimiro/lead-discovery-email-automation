"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/discover", label: "Lead Discovery" },
  // { href: "/ai-lead-discovery", label: "🤖 AI Lead Discovery" }, // Temporarily disabled
  { href: "/discovered-leads", label: "Discovered Leads" },
  { href: "/journalist-leads", label: "Journalist Leads" },
  { href: "/lead-pools", label: "Lead Pools" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/contacts", label: "Contacts" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo / Title */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">SwayPR</h1>
        <p className="text-xs text-gray-500 mt-1">Lead Discovery Platform</p>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const active = pathname === item.href;
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center px-3 py-2 rounded-lg text-sm font-medium
                    transition-colors duration-200
                    ${active 
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Card */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
            J
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">Johann</p>
            <p className="text-xs text-gray-500">Premium</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
