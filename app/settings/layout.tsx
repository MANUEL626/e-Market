"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  Bell, 
  HelpCircle,
  User,
  CreditCard,
  LogOut,
  Building2,
  BookOpen,
  Loader2
} from "lucide-react";
import { performClientLogout } from "@/lib/auth/logout-client";
import { useMemberProfile } from "@/lib/hooks/use-member-profile";
import {
  displayNameFromUser,
  initialsFromUser,
} from "@/lib/member-profile-storage";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const { profile } = useMemberProfile();
  const headerUser = profile?.user;
  const headerName = headerUser ? displayNameFromUser(headerUser) : null;
  const headerInitials = headerUser ? initialsFromUser(headerUser) : "?";

  useEffect(() => {
    if (!logoutConfirmOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loggingOut) setLogoutConfirmOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [logoutConfirmOpen, loggingOut]);

  async function confirmLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await performClientLogout();
      setLogoutConfirmOpen(false);
      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  }

  const navLinks = [
    { name: "Général", path: "/settings/general", icon: Building2 },
    { name: "Profil", path: "/settings/profile", icon: User },
    { name: "Facturation", path: "/settings/billing", icon: CreditCard },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      {logoutConfirmOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="presentation"
        >
          <button
            type="button"
            aria-label="Close"
            disabled={loggingOut}
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px] disabled:pointer-events-none"
            onClick={() => !loggingOut && setLogoutConfirmOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-dialog-title"
            className="relative z-10 w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-xl"
          >
            <h2
              id="logout-dialog-title"
              className="text-lg font-extrabold text-gray-900"
            >
              Sign out?
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              You will need to sign in again to access your workspace.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={loggingOut}
                onClick={() => setLogoutConfirmOpen(false)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loggingOut}
                onClick={confirmLogout}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700 disabled:opacity-70 sm:w-auto"
              >
                {loggingOut && (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                )}
                {loggingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0 z-10">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-xl font-extrabold text-[#3730A3] tracking-tight">
            Indigo Marketplace
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/dashboard" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition">Dashboard</Link>
            <Link href="/dashboard/stock" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition">Inventory</Link>
            <Link href="/dashboard/sales" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition">Sales</Link>
          </nav>
        </div>
        <div className="flex items-center gap-5">
          <button className="text-gray-400 hover:text-gray-600 transition relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <button className="text-gray-400 hover:text-gray-600 transition"><HelpCircle className="w-5 h-5" /></button>
          <Link
            href="/settings/profile"
            className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 shadow-sm ml-2 bg-indigo-100 flex items-center justify-center shrink-0"
            title={headerName ?? "Profil"}
          >
            {headerUser?.profile_picture ? (
              <img
                src={headerUser.profile_picture}
                alt={headerName ?? "Profil"}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[10px] font-extrabold text-indigo-700">{headerInitials}</span>
            )}
          </Link>
        </div>
      </header>
      
      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-[260px] bg-white border-r border-gray-100 flex flex-col hidden md:flex shrink-0 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-1">
               <div className="w-8 h-8 bg-[#3730A3] text-white rounded-lg flex items-center justify-center shadow-sm">
                  <Building2 className="w-4 h-4" />
               </div>
               <h2 className="text-lg font-extrabold text-gray-900">Settings</h2>
            </div>
            <p className="text-[10px] font-extrabold text-gray-400 tracking-widest uppercase mt-1 pl-11">Manage workspace</p>
          </div>

          <nav className="flex-1 px-4 py-2 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname.startsWith(link.path);
              return (
                <Link key={link.name} href={link.path} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition font-medium text-sm ${isActive ? "bg-indigo-50 text-indigo-700 font-bold border-l-4 border-indigo-600 rounded-l-none -ml-4 pl-7" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}>
                  <Icon className="w-4 h-4" />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-50 mt-auto">
             <div className="bg-[#3730A3] rounded-[16px] p-5 text-center shadow-md relative overflow-hidden mb-4">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <h4 className="text-xs font-bold text-white mb-3">Need more power?</h4>
                <button className="w-full py-2 bg-white text-[#3730A3] text-xs font-extrabold rounded-xl shadow-sm hover:bg-gray-50 transition">Upgrade Plan</button>
             </div>
             
             <button className="flex items-center gap-3 px-4 py-2 w-full text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition">
               <BookOpen className="w-4 h-4" /> Documentation
             </button>
             <button className="flex items-center gap-3 px-4 py-2 w-full text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition">
               <HelpCircle className="w-4 h-4" /> Support
             </button>
             <button
               type="button"
               disabled={loggingOut}
               onClick={() => setLogoutConfirmOpen(true)}
               className="flex items-center gap-3 px-4 py-2 w-full text-sm font-medium text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition mt-2 border-t border-gray-50 pt-3 disabled:opacity-60 disabled:pointer-events-none"
             >
               <LogOut className="w-4 h-4 shrink-0" />
               Logout
             </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#fafafa] p-8 lg:p-12 text-sm border-l border-white shadow-[inset_10px_0_30px_rgb(0,0,0,0.01)]">
          <div className="max-w-[900px]">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
}
