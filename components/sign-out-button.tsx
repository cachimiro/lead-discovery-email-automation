"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="glass px-6 py-2.5 rounded-xl text-sm font-semibold text-white hover:bg-white/30 transition-all duration-300 hover:shadow-lg"
    >
      Sign Out
    </button>
  );
}
