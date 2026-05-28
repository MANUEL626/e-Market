"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutGrid, Mail, Lock, CheckCircle, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  applyMemberMeToClientState,
  fetchMemberMe,
} from "@/lib/api/member-me";

export default function LoginPage() {
  const router = useRouter();
  const authReturnHandledRef = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showRegisteredNotice, setShowRegisteredNotice] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resetNotice, setResetNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  /** Jetons d’invitation / magic link dans le # — souvent sur /login si la Site URL ou le mail pointe ici. */
  const [authLinkHandoff, setAuthLinkHandoff] = useState(false);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const search = window.location.search;
    const hash = window.location.hash;
    const code = new URLSearchParams(search).get("code");
    const hasImplicitSession =
      Boolean(hash) &&
      hash.includes("access_token") &&
      hash.includes("refresh_token");

    if (code || hasImplicitSession) {
      authReturnHandledRef.current = true;
      setAuthLinkHandoff(true);
      router.replace(`/auth/callback${search}${hash}`);
    }
  }, [router]);

  useEffect(() => {
    if (authReturnHandledRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const authErr = params.get("error");
    if (authErr) {
      try {
        setSubmitError(decodeURIComponent(authErr.replace(/\+/g, " ")));
      } catch {
        setSubmitError(authErr);
      }
    }
    if (params.get("registered") === "1") {
      setShowRegisteredNotice(true);
    }
    if (authErr || params.get("registered") === "1") {
      window.history.replaceState({}, "", "/login");
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    let supabase;
    try {
      supabase = createClient();
    } catch {
      setSubmitError("Configuration Supabase manquante (variables d’environnement).");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setSubmitError(error.message);
        return;
      }

      const token = data.session?.access_token;
      if (!token) {
        setSubmitError("Session introuvable après connexion.");
        await supabase.auth.signOut();
        return;
      }

      try {
        const profile = await fetchMemberMe(token);
        applyMemberMeToClientState(profile);
      } catch (profileErr) {
        await supabase.auth.signOut();
        setSubmitError(
          profileErr instanceof Error
            ? profileErr.message
            : "Impossible de charger votre profil marchand."
        );
        return;
      }

      setShowSuccess(true);
      const redirectToParam = new URLSearchParams(window.location.search).get(
        "redirectTo"
      );
      const safeRedirectTarget =
        redirectToParam && redirectToParam.startsWith("/")
          ? redirectToParam
          : "/dashboard";
      setTimeout(() => {
        setShowSuccess(false);
        router.push(safeRedirectTarget);
      }, 1500);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendPasswordReset = async () => {
    setSubmitError(null);
    setResetNotice(null);
    if (!email.trim()) {
      setSubmitError("Indiquez votre e-mail avant de demander un lien de recuperation.");
      return;
    }
    let supabase;
    try {
      supabase = createClient();
    } catch {
      setSubmitError("Configuration Supabase manquante (variables d'environnement).");
      return;
    }
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback?type=recovery`
        : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });
    if (error) {
      setSubmitError(error.message);
      return;
    }
    setResetNotice("Lien de recuperation envoye si ce compte existe.");
  };

  if (authLinkHandoff) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f8fafc] items-center justify-center p-6">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-sm font-medium text-gray-700 text-center">
          Traitement du lien d’invitation…
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-fuchsia-50/30 items-center justify-center p-4">
      <div className="flex flex-col items-center w-full max-w-[420px]">
        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-6 shadow-sm">
            <LayoutGrid className="text-white w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Indigo Marketplace</h1>
          <p className="text-gray-500 text-sm">Log in to your merchant dashboard</p>
        </div>

        {/* Form Card */}
        <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full border border-gray-100">
          {showRegisteredNotice && (
            <div
              className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
              role="status"
            >
              <p className="font-semibold">Inscription réussie</p>
              <p className="mt-1 text-emerald-800/90">
                Votre compte a bien été créé. Connectez-vous avec l’e-mail et le mot de passe choisis à l’inscription.
              </p>
            </div>
          )}
          <form className="space-y-5" onSubmit={handleLogin}>
            {submitError && (
              <div
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
                role="alert"
              >
                {submitError}
              </div>
            )}
            {resetNotice && (
              <div
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                role="status"
              >
                {resetNotice}
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-gray-700 tracking-wider mb-2">EMAIL ADDRESS</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  autoComplete="email"
                  required
                  className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-transparent rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-gray-700 tracking-wider">PASSWORD</label>
                <button
                  type="button"
                  onClick={() => void sendPasswordReset()}
                  className="text-xs font-bold text-indigo-700 hover:text-indigo-800"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-transparent rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center mt-4">
              <input
                id="remember"
                type="checkbox"
                className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                Remember this device
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl transition-colors shadow-sm mt-2 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connexion…
                </>
              ) : (
                "Log In"
              )}
            </button>
          </form>

        </div>

        {/* Footer Link */}
        <p className="mt-8 text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-bold text-indigo-700 hover:text-indigo-800">
            Get Started
          </Link>
        </p>

        {/* Bottom Small Footer */}
        <div className="mt-16 text-center">
          <div className="flex gap-4 justify-center text-[10px] font-bold tracking-widest text-gray-500 mb-4">
            <Link href="/solutions" className="hover:text-gray-800">
              STATUS
            </Link>
            <Link href="/solutions" className="hover:text-gray-800">
              PRIVACY
            </Link>
            <Link href="/solutions" className="hover:text-gray-800">
              TERMS
            </Link>
            <a href="mailto:support@e-mall.local" className="hover:text-gray-800">
              CONTACT
            </a>
          </div>
          <div className="text-[10px] text-gray-400">© 2024 Indigo Marketplace. All rights reserved.</div>
        </div>
      </div>

      {/* Success Notification Popup */}
      {showSuccess && (
        <div className="fixed top-8 right-8 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-white border-l-4 border-emerald-500 rounded-xl shadow-2xl p-4 flex gap-4 items-start w-80">
            <div className="text-emerald-500 mt-0.5 flex-shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-gray-900 mb-1">Connexion réussie !</h4>
              <p className="text-xs text-gray-500">Redirection vers votre tableau de bord…</p>
            </div>
            <button
              type="button"
              onClick={() => setShowSuccess(false)}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
