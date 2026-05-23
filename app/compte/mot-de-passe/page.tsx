"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  applyMemberMeToClientState,
  fetchMemberMe,
} from "@/lib/api/member-me";

/**
 * Après invitation ou récupération : l’utilisateur a déjà une session ;
 * il définit ici son mot de passe (guide : updateUser).
 */
export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let supabase;
    try {
      supabase = createClient();
    } catch {
      router.replace("/login?error=" + encodeURIComponent("Configuration Supabase manquante."));
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace(
          "/login?error=" +
            encodeURIComponent("Session requise. Utilisez le lien reçu par e-mail.")
        );
        return;
      }
      setSessionReady(true);
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    let supabase;
    try {
      supabase = createClient();
    } catch {
      setError("Configuration Supabase manquante.");
      return;
    }

    setBusy(true);
    try {
      const { error: upErr } = await supabase.auth.updateUser({ password });
      if (upErr) {
        setError(upErr.message);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (token) {
        try {
          const profile = await fetchMemberMe(token);
          applyMemberMeToClientState(profile);
        } catch {
          /* session OK même si profil échoue temporairement */
        }
      }

      router.replace("/dashboard");
    } finally {
      setBusy(false);
    }
  }

  if (!sessionReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] p-6">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-2" />
        <p className="text-sm text-gray-600">Vérification de la session…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50/50 via-white to-fuchsia-50/30 p-4">
      <div className="w-full max-w-[420px] bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-1">
          Définir votre mot de passe
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Choisissez un mot de passe sécurisé pour accéder à votre espace marchand.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
              role="alert"
            >
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 tracking-wider mb-2">
              NOUVEAU MOT DE PASSE
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
                className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-transparent rounded-xl text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="Au moins 8 caractères"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 tracking-wider mb-2">
              CONFIRMER
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
              className="block w-full px-3 py-3 bg-gray-50 border border-transparent rounded-xl text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 mt-2"
          >
            {busy ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enregistrement…
              </>
            ) : (
              "Continuer vers le tableau de bord"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href="/login" className="font-bold text-indigo-700 hover:underline">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
