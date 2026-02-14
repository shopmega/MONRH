"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    const supabase = createSupabaseClient();
    supabase.auth
      .getUser()
      .then((result: { data?: { user?: unknown }; error?: unknown }) => {
        if (result.error || !result.data?.user) {
          setError("Lien invalide ou expire. Relancez la recuperation.");
          return;
        }
        setReady(true);
      })
      .catch(() => {
        setError("Impossible de verifier votre session.");
      });
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setStatus(undefined);

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createSupabaseClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError("Mise a jour impossible. Reessayez.");
        return;
      }

      setStatus("Mot de passe mis a jour. Redirection vers la connexion...");
      setTimeout(() => {
        router.replace("/connexion");
        router.refresh();
      }, 1200);
    } catch {
      setError("Erreur reseau. Reessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="paper-bg min-h-screen">
      <div className="mx-auto w-full max-w-md px-4 pb-10 pt-10 sm:px-6">
        <section className="soft-card rounded-3xl p-6">
          <p className="section-kicker">Securite</p>
          <h1 className="display-font mt-2 text-3xl font-semibold">Nouveau mot de passe</h1>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Definissez un nouveau mot de passe pour votre compte.
          </p>

          {ready ? (
            <form onSubmit={onSubmit} className="mt-5 space-y-3">
              <label className="block text-sm font-semibold">
                Nouveau mot de passe
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="input-shell mt-1"
                  autoComplete="new-password"
                  required
                />
              </label>
              <label className="block text-sm font-semibold">
                Confirmer mot de passe
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="input-shell mt-1"
                  autoComplete="new-password"
                  required
                />
              </label>
              <button type="submit" disabled={loading} className="btn-primary w-full px-4 py-2.5 text-sm">
                {loading ? "Mise a jour..." : "Mettre a jour"}
              </button>
            </form>
          ) : (
            <p className="mt-5 text-sm text-[var(--ink-soft)]">Verification de la session...</p>
          )}

          {status ? <p className="status-info mt-3 rounded-xl px-3 py-2 text-sm">{status}</p> : null}
          {error ? <p className="status-error mt-3 rounded-xl px-3 py-2 text-sm">{error}</p> : null}

          <Link href="/mot-de-passe-oublie" className="mt-4 inline-block text-sm font-semibold text-[var(--accent)]">
            Demander un nouveau lien
          </Link>
        </section>
      </div>
    </main>
  );
}
