"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  applyMemberMeToClientState,
  fetchMemberMe,
} from "@/lib/api/member-me";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Connexion en cours…");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      let supabase;
      try {
        supabase = createClient();
      } catch {
        router.replace("/login?error=" + encodeURIComponent("Configuration Supabase manquante."));
        return;
      }

      const oauthError = searchParams.get("error");
      const oauthDesc = searchParams.get("error_description");
      if (oauthError) {
        router.replace(
          `/login?error=${encodeURIComponent(oauthDesc || oauthError)}`
        );
        return;
      }

      const flowInvite = searchParams.get("flow") === "invite";
      const queryType = searchParams.get("type");

      const hashRaw =
        typeof window !== "undefined"
          ? window.location.hash.replace(/^#/, "")
          : "";
      const hashParams = new URLSearchParams(hashRaw);
      const hashType = hashParams.get("type");
      const access_token = hashParams.get("access_token");
      const refresh_token = hashParams.get("refresh_token");

      const code = searchParams.get("code");

      if (code) {
        setMessage("Validation du lien sécurisé…");
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (error) {
          router.replace(`/login?error=${encodeURIComponent(error.message)}`);
          return;
        }
      } else if (access_token && refresh_token) {
        setMessage("Ouverture de session…");
        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (cancelled) return;
        if (error) {
          router.replace(`/login?error=${encodeURIComponent(error.message)}`);
          return;
        }
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search
        );
      } else {
        const {
          data: { session: existing },
        } = await supabase.auth.getSession();
        if (!existing && !cancelled) {
          router.replace(
            "/login?error=" +
              encodeURIComponent("Lien invalide, expiré ou déjà utilisé.")
          );
          return;
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled || !session?.access_token) {
        if (!cancelled) {
          router.replace(
            "/login?error=" + encodeURIComponent("Session introuvable.")
          );
        }
        return;
      }

      setMessage("Chargement de votre espace marchand…");
      try {
        const profile = await fetchMemberMe(session.access_token);
        if (cancelled) return;
        applyMemberMeToClientState(profile);
      } catch (e) {
        await supabase.auth.signOut();
        if (cancelled) return;
        router.replace(
          `/login?error=${encodeURIComponent(
            e instanceof Error ? e.message : "Profil marchand introuvable."
          )}`
        );
        return;
      }

      const needsPasswordSetup =
        flowInvite ||
        queryType === "invite" ||
        queryType === "recovery" ||
        hashType === "invite" ||
        hashType === "recovery" ||
        hashType === "signup";

      if (cancelled) return;

      if (needsPasswordSetup) {
        router.replace("/compte/mot-de-passe");
      } else {
        router.replace("/dashboard");
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] p-6">
      <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-4" />
      <p className="text-sm font-medium text-gray-700 text-center max-w-sm">
        {message}
      </p>
      <p className="text-xs text-gray-500 mt-3 text-center max-w-md">
        Si rien ne se passe, vérifiez que l’URL de callback est bien autorisée dans
        Supabase (Redirect URLs) et que le lien n’a pas expiré.
      </p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
          <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
