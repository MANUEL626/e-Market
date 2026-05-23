"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  displayNameFromUser,
  getStoredMemberProfile,
  initialsFromUser,
} from "@/lib/member-profile-storage";
import { getPrimaryMembership, loadMemberProfileForSession } from "@/lib/api/member-me";
import { isAdminProfile } from "@/lib/authz";
import { getAvatarPublicUrl } from "@/lib/supabase/avatar-url";
import { normalizeLocale, translate, type AppLocale } from "@/lib/i18n";
import {
  LayoutDashboard,
  Megaphone,
  Package,
  LineChart,
  Users,
  Truck,
  Mail,
  Search,
  Bell,
  Settings,
  ClipboardList,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [orgLabel, setOrgLabel] = useState("Indigo Market");
  const [userLabel, setUserLabel] = useState("The Indigo Marketplace");
  const [userInitials, setUserInitials] = useState("AL");
  const [orgAvatarUrl, setOrgAvatarUrl] = useState<string | null>(null);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [locale, setLocale] = useState<AppLocale>("fr");
  const t = (key: string) => translate(locale, key);

  useEffect(() => {
    let cancelled = false;

    function applyFromStorage() {
      const p = getStoredMemberProfile();
      if (!p) return;
      const org = getPrimaryMembership(p)?.organization;
      if (!cancelled) {
        setOrgLabel(org?.name ?? "Indigo Market");
        setOrgAvatarUrl(getAvatarPublicUrl(org?.profile_picture));
        setUserLabel(displayNameFromUser(p.user));
        setUserInitials(initialsFromUser(p.user));
        setUserAvatarUrl(getAvatarPublicUrl(p.user.profile_picture));
        setIsAdmin(isAdminProfile(p));
        setLocale(normalizeLocale(p.params?.locale));
      }
    }

    applyFromStorage();

    (async () => {
      await loadMemberProfileForSession();
      if (!cancelled) applyFromStorage();
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const isActive = (path: string) => {
    if (path === "/dashboard" && pathname === "/dashboard") return true;
    if (path === "/dashboard/stock/posts") {
      return pathname.startsWith("/dashboard/stock/posts");
    }
    if (path === "/dashboard/stock") {
      if (!pathname.startsWith("/dashboard/stock")) return false;
      if (pathname.startsWith("/dashboard/stock/posts")) return false;
      return true;
    }
    if (path !== "/dashboard" && pathname.startsWith(path)) return true;
    return false;
  };

  const linkClass = (path: string) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${
      isActive(path)
        ? "bg-indigo-50 text-[#3730A3] font-semibold"
        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
    }`;

  return (
    <div className="fixed inset-0 flex min-h-0 w-full overflow-hidden bg-[#f8fafc]">
      {/* Sidebar — shrink-0 + min-h-0 : ne participe pas au scroll du document */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col min-h-0 border-r border-gray-100 bg-white">
        <div className="shrink-0 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-indigo-100 text-sm font-extrabold text-indigo-700">
              {orgAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={orgAvatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                orgLabel.slice(0, 2).toUpperCase()
              )}
            </div>
            <h2 className="text-xl font-bold text-[#3730A3] tracking-tight line-clamp-2">{orgLabel}</h2>
          </div>
          <p className="text-[10px] font-bold text-gray-400 tracking-widest mt-1 uppercase">Premium Merchant</p>
        </div>

        <nav className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-4 space-y-1">
          <Link href="/dashboard" className={linkClass("/dashboard")}>
            <LayoutDashboard className="w-5 h-5" />
            {t("dashboard")}
          </Link>
          <Link href="/dashboard/stock" className={linkClass("/dashboard/stock")}>
            <Package className="w-5 h-5" />
            {t("stock")}
          </Link>
          {isAdmin && (
            <>
              <Link href="/dashboard/stock/posts" className={linkClass("/dashboard/stock/posts")}>
                <Megaphone className="w-5 h-5" />
                {t("postsShowcase")}
              </Link>
              <Link href="/dashboard/orders" className={linkClass("/dashboard/orders")}>
                <ClipboardList className="w-5 h-5" />
                {t("purchaseOrders")}
              </Link>
            </>
          )}
          <Link href="/dashboard/sales" className={linkClass("/dashboard/sales")}>
            <LineChart className="w-5 h-5" />
            {t("sales")}
          </Link>
          {isAdmin && (
            <Link href="/dashboard/team" className={linkClass("/dashboard/team")}>
              <Users className="w-5 h-5" />
              {t("team")}
            </Link>
          )}
          <Link href="/dashboard/delivery" className={linkClass("/dashboard/delivery")}>
            <Truck className="w-5 h-5" />
            {t("delivery")}
          </Link>
          <Link href="/dashboard/messages" className={linkClass("/dashboard/messages")}>
            <Mail className="w-5 h-5" />
            {t("messages")}
          </Link>
        </nav>
      </aside>

      {/* Main Content — min-h-0 indispensable pour un seul scroll interne (flex + overflow) */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-gray-100 bg-white px-8">
          <div className="flex-1 max-w-2xl relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder={t("searchPlaceholder")}
              className="w-full bg-[#f8fafc] border-transparent rounded-full py-3 pl-12 pr-4 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition border"
            />
          </div>
          <div className="flex items-center gap-6 ml-8">
            <button className="text-gray-400 hover:text-gray-600 relative transition">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <Link href="/settings/profile" className="text-gray-400 hover:text-indigo-600 transition">
              <Settings className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3 border-l border-gray-200 pl-6">
              <span className="text-sm font-medium text-gray-700 max-w-[200px] truncate" title={userLabel}>
                {userLabel}
              </span>
              <div className="w-9 h-9 bg-indigo-100 rounded-full overflow-hidden border-2 border-white shadow-sm flex justify-center items-center shrink-0">
                {userAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={userAvatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-indigo-700">{userInitials}</span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content — seul conteneur de défilement vertical principal */}
        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain p-6 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
