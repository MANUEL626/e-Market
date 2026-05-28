"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { HomeAuthActions } from "@/components/home-auth-actions";

const navLinks = [
  { href: "/", label: "Marketplace" },
  { href: "/solutions", label: "Solutions" },
  { href: "/pricing", label: "Pricing" },
];

export function PublicSiteHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="relative z-20 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-4 sm:px-8">
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
        <Link href="/" className="truncate text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
          Indigo Marketplace
        </Link>
        <nav className="hidden gap-6 text-sm font-medium text-gray-500 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                isActive(link.href)
                  ? "border-b-2 border-indigo-600 pb-1 text-indigo-600"
                  : "transition hover:text-gray-900"
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="hidden items-center gap-6 sm:flex">
        <HomeAuthActions variant="header" />
      </div>

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
              <Link
                href="/"
                className="truncate text-lg font-extrabold tracking-tight text-gray-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                Indigo Marketplace
              </Link>
              <button
                type="button"
                aria-label="Fermer le menu"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    isActive(link.href)
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="shrink-0 border-t border-gray-100 p-4">
              <div className="flex flex-col gap-3">
                <HomeAuthActions variant="header" />
              </div>
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}
