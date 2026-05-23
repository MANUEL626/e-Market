"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type HomeAuthActionsProps = {
  variant: "header" | "hero" | "cta";
};

export function HomeAuthActions({ variant }: HomeAuthActionsProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    try {
      const supabase = createClient();

      supabase.auth
        .getSession()
        .then(({ data }) => {
          if (mounted) setIsAuthenticated(Boolean(data.session));
        })
        .catch(() => {
          if (mounted) setIsAuthenticated(false);
        })
        .finally(() => {
          if (mounted) setIsReady(true);
        });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (mounted) {
          setIsAuthenticated(Boolean(session));
          setIsReady(true);
        }
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    } catch {
      setIsAuthenticated(false);
      setIsReady(true);
      return undefined;
    }
  }, []);

  if (!isReady) {
    return <div className={variant === "header" ? "h-10 w-40" : "h-12 w-48"} aria-hidden="true" />;
  }

  if (isAuthenticated) {
    const className =
      variant === "header"
        ? "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-full hover:bg-indigo-700 transition"
        : variant === "cta"
          ? "inline-flex items-center justify-center gap-2 px-8 py-3 text-base font-semibold text-white bg-gray-900 hover:bg-black rounded-full transition"
          : "inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-white bg-[#3730A3] hover:bg-indigo-800 rounded-full transition";

    return (
      <Link href="/dashboard" className={className}>
        <LayoutDashboard className="h-4 w-4" />
        Acceder au dashboard
      </Link>
    );
  }

  if (variant === "header") {
    return (
      <>
        <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900">
          Sign In
        </Link>
        <Link
          href="/register"
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-full hover:bg-indigo-700 transition"
        >
          Get Started
        </Link>
      </>
    );
  }

  if (variant === "cta") {
    return (
      <Link
        href="/register"
        className="px-8 py-3 text-base font-semibold text-white bg-gray-900 hover:bg-black rounded-full transition"
      >
        Get Started Now
      </Link>
    );
  }

  return (
    <>
      <Link
        href="/register"
        className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-white bg-[#3730A3] hover:bg-indigo-800 rounded-full transition"
      >
        Create a store <ArrowRight className="w-4 h-4" />
      </Link>
      <Link
        href="/login"
        className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-full transition"
      >
        Log in
      </Link>
    </>
  );
}
