"use client";

import { useLayoutEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Si la Site URL Supabase est `http://localhost:3000` (sans chemin), le retour
 * d’invitation peut atterrir sur `/` avec les jetons dans le # — même traitement
 * que pour `/login` → `/auth/callback`.
 */
export function AuthHashBootstrap() {
  const pathname = usePathname();
  const router = useRouter();

  useLayoutEffect(() => {
    if (pathname !== "/") return;
    const hash = window.location.hash;
    if (
      !hash ||
      !hash.includes("access_token") ||
      !hash.includes("refresh_token")
    ) {
      return;
    }
    router.replace(`/auth/callback${window.location.search}${hash}`);
  }, [pathname, router]);

  return null;
}
