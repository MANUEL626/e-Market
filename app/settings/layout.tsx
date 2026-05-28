"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  Bell, 
  HelpCircle,
  User,
  CreditCard,
  BarChart3,
  LogOut,
  Building2,
  BookOpen,
  Loader2,
  Menu,
  X
} from "lucide-react";
import { performClientLogout } from "@/lib/auth/logout-client";
import { useMemberProfile } from "@/lib/hooks/use-member-profile";
import { getPrimaryMembership } from "@/lib/api/member-me";
import {
  displayNameFromUser,
  initialsFromUser,
} from "@/lib/member-profile-storage";
import { getAvatarPublicUrl } from "@/lib/supabase/avatar-url";
import { translate } from "@/lib/i18n";
import { DashboardAccessProvider } from "@/components/dashboard/dashboard-access-provider";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardAccessProvider>
      <SettingsShell>{children}</SettingsShell>
    </DashboardAccessProvider>
  );
}

function SettingsShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { profile } = useMemberProfile();
  const t = (key: string) => translate(profile?.params?.locale, key);
  const headerUser = profile?.user;
  const headerName = headerUser ? displayNameFromUser(headerUser) : null;
  const headerInitials = headerUser ? initialsFromUser(headerUser) : "?";
  const headerAvatarUrl = getAvatarPublicUrl(headerUser?.profile_picture);
  const organization = profile ? getPrimaryMembership(profile)?.organization : null;
  const organizationName = organization?.name ?? "Indigo Marketplace";
  const organizationAvatarUrl = getAvatarPublicUrl(organization?.profile_picture);
  const isSalesOrganization = organization?.org_type === "sales";
  const isDeliveryOrganization = organization?.org_type === "delivery";

  useEffect(() => {
    if (!logoutConfirmOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loggingOut) setLogoutConfirmOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [logoutConfirmOpen, loggingOut]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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
    { name: t("general"), path: "/settings/general", icon: Building2 },
    { name: t("profile"), path: "/settings/profile", icon: User },
    { name: "Rapports", path: "/settings/reports", icon: BarChart3 },
    { name: t("billing"), path: "/settings/billing", icon: CreditCard },
  ];

  const dashboardLinks = [
    { name: t("dashboard"), path: "/dashboard" },
    ...(isSalesOrganization
      ? [
          { name: t("stock"), path: "/dashboard/stock" },
          { name: t("sales"), path: "/dashboard/sales" },
        ]
      : []),
    ...(isDeliveryOrganization ? [{ name: t("delivery"), path: "/dashboard/delivery" }] : []),
  ];

  const settingsLinkClass = (path: string) => {
    const isActive = pathname.startsWith(path);
    return `flex items-center gap-3 px-4 py-2.5 rounded-xl transition font-medium text-sm ${
      isActive
        ? "bg-indigo-50 text-indigo-700 font-bold md:border-l-4 md:border-indigo-600 md:rounded-l-none md:-ml-4 md:pl-7"
        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
    }`;
  };

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-[#f8fafc]">
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
              {t("signOutQuestion")}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {t("signOutText")}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={loggingOut}
                onClick={() => setLogoutConfirmOpen(false)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
              >
                {t("cancel")}
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
                {loggingOut ? t("signingOut") : t("signOut")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-8 shrink-0 z-10">
        <div className="flex min-w-0 items-center gap-3 md:gap-8">
          <button
            type="button"
            aria-label="Ouvrir le menu"
            aria-expanded={mobileMenuOpen}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:bg-gray-50 hover:text-gray-900 md:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-3 text-xl font-extrabold text-[#3730A3] tracking-tight">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-indigo-100 text-xs font-extrabold text-indigo-700">
              {organizationAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={organizationAvatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                organizationName.slice(0, 2).toUpperCase()
              )}
            </span>
            <span className="max-w-[180px] truncate sm:max-w-[260px]">{organizationName}</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {dashboardLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className="text-sm font-medium text-gray-500 hover:text-gray-900 transition"
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
          <button className="text-gray-400 hover:text-gray-600 transition relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <button className="text-gray-400 hover:text-gray-600 transition"><HelpCircle className="w-5 h-5" /></button>
          <Link
            href="/settings/profile"
            className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 shadow-sm ml-2 bg-indigo-100 flex items-center justify-center shrink-0"
            title={headerName ?? t("profile")}
          >
            {headerAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={headerAvatarUrl}
                alt={headerName ?? t("profile")}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[10px] font-extrabold text-indigo-700">{headerInitials}</span>
            )}
          </Link>
        </div>
      </header>

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
                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-indigo-100 text-xs font-extrabold text-indigo-700">
                  {organizationAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={organizationAvatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    organizationName.slice(0, 2).toUpperCase()
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-base font-extrabold text-[#3730A3]">{organizationName}</p>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Manage workspace</p>
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

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              <p className="px-4 pb-2 text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
                Navigation
              </p>
              <nav className="space-y-1">
                {dashboardLinks.map((link) => (
                  <Link
                    key={link.path}
                    href={link.path}
                    className="flex items-center rounded-xl px-4 py-2.5 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>

              <p className="mt-6 px-4 pb-2 text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
                Parametres
              </p>
              <nav className="space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.name}
                      href={link.path}
                      className={settingsLinkClass(link.path)}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {link.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="shrink-0 border-t border-gray-100 p-4">
              <Link
                href="/solutions"
                className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
              >
                <BookOpen className="h-4 w-4 shrink-0" /> {t("documentation")}
              </Link>
              <a
                href="mailto:support@e-mall.local"
                className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
              >
                <HelpCircle className="h-4 w-4 shrink-0" /> {t("support")}
              </a>
              <button
                type="button"
                disabled={loggingOut}
                onClick={() => {
                  setMobileMenuOpen(false);
                  setLogoutConfirmOpen(true);
                }}
                className="mt-2 flex w-full items-center gap-3 rounded-xl border-t border-gray-50 px-4 py-3 text-sm font-medium text-gray-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:pointer-events-none disabled:opacity-60"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {t("logout")}
              </button>
            </div>
          </aside>
        </div>
      )}
      
      {/* Main layout */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="hidden min-h-0 w-[260px] shrink-0 flex-col border-r border-gray-100 bg-white md:flex">
          <div className="shrink-0 p-6">
            <div className="flex items-center gap-3 mb-1">
               <div className="w-8 h-8 bg-[#3730A3] text-white rounded-lg flex items-center justify-center shadow-sm overflow-hidden">
                  {organizationAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={organizationAvatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Building2 className="w-4 h-4" />
                  )}
               </div>
               <h2 className="text-lg font-extrabold text-gray-900 truncate">{organizationName}</h2>
            </div>
            <p className="text-[10px] font-extrabold text-gray-400 tracking-widest uppercase mt-1 pl-11">Manage workspace</p>
          </div>

          <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-4 py-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.name} href={link.path} className={settingsLinkClass(link.path)}>
                  <Icon className="w-4 h-4" />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          <div className="shrink-0 border-t border-gray-50 p-4">
             <div className="bg-[#3730A3] rounded-[16px] p-5 text-center shadow-md relative overflow-hidden mb-4">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <h4 className="text-xs font-bold text-white mb-3">{t("morePower")}</h4>
                <Link
                  href="/settings/billing"
                  className="block w-full py-2 bg-white text-[#3730A3] text-xs font-extrabold rounded-xl shadow-sm hover:bg-gray-50 transition"
                >
                  {t("upgradePlan")}
                </Link>
             </div>
             
             <Link
               href="/solutions"
               className="flex items-center gap-3 px-4 py-2 w-full text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition"
             >
               <BookOpen className="w-4 h-4" /> {t("documentation")}
             </Link>
             <a
               href="mailto:support@e-mall.local"
               className="flex items-center gap-3 px-4 py-2 w-full text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition"
             >
               <HelpCircle className="w-4 h-4" /> {t("support")}
             </a>
             <button
               type="button"
               disabled={loggingOut}
               onClick={() => setLogoutConfirmOpen(true)}
               className="flex items-center gap-3 px-4 py-2 w-full text-sm font-medium text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition mt-2 border-t border-gray-50 pt-3 disabled:opacity-60 disabled:pointer-events-none"
             >
               <LogOut className="w-4 h-4 shrink-0" />
               {t("logout")}
             </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="min-h-0 flex-1 overflow-y-auto bg-[#fafafa] p-6 text-sm border-l border-white shadow-[inset_10px_0_30px_rgb(0,0,0,0.01)] sm:p-8 lg:p-12">
          <div className="max-w-[900px]">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
}
