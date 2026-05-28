"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  displayNameFromUser,
  initialsFromUser,
} from "@/lib/member-profile-storage";
import { getPrimaryMembership } from "@/lib/api/member-me";
import { getAvatarPublicUrl } from "@/lib/supabase/avatar-url";
import { normalizeLocale, translate, type AppLocale } from "@/lib/i18n";
import {
  DashboardAccessProvider,
  useDashboardAccess,
} from "@/components/dashboard/dashboard-access-provider";
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
  Menu,
  X,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardAccessProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardAccessProvider>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    profile,
    isAdmin,
    isSalesOrganization,
    isDeliveryOrganization,
    memberRole,
    subscriptionPlan,
    hasFeature,
  } = useDashboardAccess();
  const [orgLabel, setOrgLabel] = useState("Indigo Market");
  const [userLabel, setUserLabel] = useState("The Indigo Marketplace");
  const [userInitials, setUserInitials] = useState("AL");
  const [orgAvatarUrl, setOrgAvatarUrl] = useState<string | null>(null);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [locale, setLocale] = useState<AppLocale>("fr");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = (key: string) => translate(locale, key);

  useEffect(() => {
    if (!profile) return;
    const org = getPrimaryMembership(profile)?.organization;
    setOrgLabel(org?.name ?? "Indigo Market");
    setOrgAvatarUrl(getAvatarPublicUrl(org?.profile_picture));
    setUserLabel(displayNameFromUser(profile.user));
    setUserInitials(initialsFromUser(profile.user));
    setUserAvatarUrl(getAvatarPublicUrl(profile.user.profile_picture));
    setLocale(normalizeLocale(profile.params?.locale));
  }, [profile]);

  useEffect(() => {
    if (isAdmin || !pathname.startsWith("/dashboard/stock/posts")) return;
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [isAdmin, mobileMenuOpen, pathname]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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

  const navLinks = [
    {
      href: "/dashboard",
      label: t("dashboard"),
      icon: LayoutDashboard,
      adminOnly: false,
      workspace: "all",
    },
    {
      href: "/dashboard/stock",
      label: t("stock"),
      icon: Package,
      adminOnly: false,
      workspace: "sales",
    },
    {
      href: "/dashboard/stock/posts",
      label: t("postsShowcase"),
      icon: Megaphone,
      adminOnly: true,
      workspace: "sales",
    },
    {
      href: "/dashboard/orders",
      label: t("purchaseOrders"),
      icon: ClipboardList,
      adminOnly: true,
      workspace: "sales",
    },
    {
      href: "/dashboard/sales",
      label: t("sales"),
      icon: LineChart,
      adminOnly: false,
      workspace: "sales",
    },
    {
      href: "/dashboard/team",
      label: t("team"),
      icon: Users,
      adminOnly: true,
      workspace: "all",
    },
    {
      href: "/dashboard/delivery",
      label: t("delivery"),
      icon: Truck,
      adminOnly: false,
      workspace: "delivery",
    },
    {
      href: "/dashboard/messages",
      label: t("messages"),
      icon: Mail,
      adminOnly: false,
      workspace: "all",
    },
  ];

  const visibleNavLinks = navLinks.filter((link) => {
    if (link.adminOnly && !isAdmin) return false;
    if (link.workspace === "sales") return isSalesOrganization;
    if (link.workspace === "delivery") {
      if (isDeliveryOrganization || memberRole === "delivery_management") return true;
      return isSalesOrganization && hasFeature("pickup_delivery");
    }
    return true;
  });

  const NavItems = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {visibleNavLinks.map((link) => {
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={linkClass(link.href)}
            onClick={onNavigate}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {link.label}
          </Link>
        );
      })}
    </>
  );

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
          <p className="text-[10px] font-bold text-gray-400 tracking-widest mt-1 uppercase">
            Plan {subscriptionPlan ?? "actif"}
          </p>
        </div>

        <nav className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-4 space-y-1">
          <NavItems />
        </nav>
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="presentation">
          <button
            type="button"
            aria-label="Fermer le menu"
            className="absolute inset-0 bg-gray-900/35 backdrop-blur-[2px]"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside
            className="relative z-10 flex h-full w-[min(86vw,320px)] flex-col bg-white shadow-2xl"
            aria-label="Navigation mobile"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-indigo-100 text-sm font-extrabold text-indigo-700">
                  {orgAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={orgAvatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    orgLabel.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-extrabold text-[#3730A3]">{orgLabel}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Plan {subscriptionPlan ?? "actif"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Fermer le menu"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-4 py-4">
              <NavItems onNavigate={() => setMobileMenuOpen(false)} />
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content — min-h-0 indispensable pour un seul scroll interne (flex + overflow) */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-100 bg-white px-4 sm:h-20 sm:px-8">
          <div className="flex min-w-0 items-center gap-3 md:hidden">
            <button
              type="button"
              aria-label="Ouvrir le menu"
              aria-expanded={mobileMenuOpen}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="truncate text-sm font-extrabold text-[#3730A3]">{orgLabel}</span>
          </div>
          <div className="relative hidden flex-1 md:block max-w-2xl">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder={t("searchPlaceholder")}
              className="w-full bg-[#f8fafc] border-transparent rounded-full py-3 pl-12 pr-4 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition border"
            />
          </div>
          <div className="flex items-center gap-3 sm:gap-6 md:ml-8">
            <button className="text-gray-400 hover:text-gray-600 relative transition">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <Link href="/settings/profile" className="text-gray-400 hover:text-indigo-600 transition">
              <Settings className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3 sm:border-l sm:border-gray-200 sm:pl-6">
              <span className="hidden text-sm font-medium text-gray-700 max-w-[200px] truncate sm:block" title={userLabel}>
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
