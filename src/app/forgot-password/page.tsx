"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createSupabaseClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>();
  const [error, setError] = useState<string>();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus(undefined);
    setError(undefined);

    try {
      const supabase = createSupabaseClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/reinitialiser-mot-de-passe`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (resetError) {
        setError("Envoi impossible. Verifiez l'email puis reessayez.");
        return;
      }

      setStatus("Email envoye. Ouvrez le lien recu pour definir un nouveau mot de passe.");
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
          <p className="section-kicker">Recuperation</p>
          <h1 className="display-font mt-2 text-3xl font-semibold">Mot de passe oublie</h1>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Entrez votre email pour recevoir un lien de reinitialisation.
          </p>

          <form onSubmit={onSubmit} className="mt-5 space-y-3">
            <label className="block text-sm font-semibold">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="input-shell mt-1"
                required
              />
            </label>
            <button type="submit" disabled={loading} className="btn-primary w-full px-4 py-2.5 text-sm">
              {loading ? "Envoi..." : "Envoyer le lien"}
            </button>
          </form>

          {status ? <p className="status-info mt-3 rounded-xl px-3 py-2 text-sm">{status}</p> : null}
          {error ? <p className="status-error mt-3 rounded-xl px-3 py-2 text-sm">{error}</p> : null}

          <Link href="/connexion" className="mt-4 inline-block text-sm font-semibold text-[var(--accent)]">
            Retour a la connexion
          </Link>
        </section>
      </div>
    </main>
  );
}
