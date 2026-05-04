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
                <Link href="#" className="text-xs font-bold text-indigo-700 hover:text-indigo-800">
                  Forgot Password?
                </Link>
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

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-4 bg-white text-gray-500 tracking-wider">OR CONTINUE WITH</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-100 bg-gray-50/50 hover:bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 transition lg:px-6"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-100 bg-gray-50/50 hover:bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 transition"
              >
                <LayoutGrid className="w-4 h-4 text-gray-500" />
                SSO
              </button>
            </div>
          </div>
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
            <Link href="#" className="hover:text-gray-800">
              STATUS
            </Link>
            <Link href="#" className="hover:text-gray-800">
              PRIVACY
            </Link>
            <Link href="#" className="hover:text-gray-800">
              TERMS
            </Link>
            <Link href="#" className="hover:text-gray-800">
              CONTACT
            </Link>
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
