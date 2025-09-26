"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { href: "/", label: "Home" },
  { href: "/person", label: "Find a Person's Email" },
  { href: "/decision-maker", label: "Find a Decision Maker's Email" },
  { href: "/company", label: "Find All Emails at a Company" },
  { href: "/linkedin", label: "Find Emails by LinkedIn URL" },
  // { href: "/leads", label: "Saved Leads" }, // ← hidden for now
];


export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-red-700 text-white flex flex-col">
      {/* Logo / Title */}
      <div className="p-6 text-2xl font-bold border-b border-red-500">
        SwayPR
      </div>

      {/* Menu */}
      <nav className="flex-1 mt-4">
        <ul>
          {menuItems.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block px-6 py-3 text-sm font-medium transition-colors
                    ${active ? "bg-white text-red-700" : "hover:bg-red-600"}
                  `}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
