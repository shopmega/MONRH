"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/components/language-provider";
import { createSupabaseClient } from "@/lib/supabase/client";

function sanitizeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/")) return "/compte";
  if (value.startsWith("//")) return "/compte";
  return value;
}

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export default function LoginPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string>();
  const nextPath = useMemo(() => sanitizeNextPath(searchParams.get("next")), [searchParams]);
  const oauthError = searchParams.get("error");

  async function canAccessNextPath(pathname: string): Promise<boolean> {
    if (!isAdminPath(pathname)) {
      return true;
    }

    try {
      const response = await fetch("/api/admin/me");
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; authenticated?: boolean };
      return Boolean(response.ok && data.ok && data.authenticated);
    } catch {
      return false;
    }
  }

  useEffect(() => {
    let active = true;
    fetch("/api/user/session")
      .then((response) => response.json())
      .then((data: { ok: boolean; authenticated?: boolean }) => {
        if (!active) return;
        if (data.ok && data.authenticated) {
          canAccessNextPath(nextPath).then((allowed) => {
            if (!active) return;
            if (!allowed) {
              setError("Compte connecte, mais role admin requis pour cet acces.");
              setChecking(false);
              return;
            }
            router.replace(nextPath);
            router.refresh();
          });
        } else {
          setChecking(false);
        }
      })
      .catch(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
    };
  }, [nextPath, router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(undefined);

    try {
      const response = await fetch("/api/user/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, email, password }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        retryAfter?: number;
        mode?: "signin" | "signup";
        requiresEmailConfirmation?: boolean;
      };
      if (!response.ok || !data.ok) {
        if (data.error === "too_many_attempts" && typeof data.retryAfter === "number") {
          setError(`Trop de tentatives. Reessayez dans ${data.retryAfter}s.`);
        } else if (data.error === "invalid_payload") {
          setError("Email et mot de passe requis.");
        } else {
          setError(t("accountPage.sessionDenied"));
        }
        return;
      }
      if (data.mode === "signup" && data.requiresEmailConfirmation) {
        setError(
          "Compte cree. Verifiez votre email pour confirmer l'inscription, puis reconnectez-vous.",
        );
        setMode("signin");
        setPassword("");
        return;
      }
      const allowed = await canAccessNextPath(nextPath);
      if (!allowed) {
        setError("Connexion reussie, mais ce compte n'a pas de role admin.");
        return;
      }
      window.dispatchEvent(new Event("salarie-auth-changed"));
      router.replace(nextPath);
      router.refresh();
    } catch {
      setError(t("accountPage.sessionDenied"));
    } finally {
      setLoading(false);
    }
  }

  async function signInWithLinkedIn() {
    setLoading(true);
    setError(undefined);
    try {
      const supabase = createSupabaseClient();
      const callback = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "linkedin_oidc",
        options: {
          redirectTo: callback,
        },
      });

      if (signInError) {
        setError("Connexion LinkedIn impossible pour le moment.");
      }
    } catch {
      setError("Connexion LinkedIn impossible pour le moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="paper-bg min-h-screen">
      <div className="mx-auto w-full max-w-5xl px-4 pb-10 pt-10 sm:px-6">
        <section className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
          <article className="soft-card rounded-3xl p-6 sm:p-8">
            <p className="section-kicker">{t("accountPage.kicker")}</p>
            <h1 className="display-font mt-2 text-3xl font-semibold sm:text-4xl">
              Connexion espace personnel
            </h1>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">{t("accountPage.description")}</p>
            <div className="mt-4 grid gap-2 text-sm text-[var(--ink-soft)]">
              <p>1. Accedez a vos simulations et documents sauvegardes.</p>
              <p>2. Vos donnees restent liees a votre session utilisateur.</p>
              <p>3. Deconnexion possible a tout moment depuis le compte.</p>
            </div>
          </article>

          <article className="soft-card rounded-3xl p-6">
            <h2 className="display-font text-2xl font-semibold">{t("accountPage.sessionLogin")}</h2>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">Utilisez vos identifiants d&apos;acces.</p>
            <button
              type="button"
              onClick={signInWithLinkedIn}
              disabled={loading}
              className="btn-muted mt-4 w-full px-4 py-2.5 text-sm"
            >
              {loading ? t("common.loading") : "Continuer avec LinkedIn"}
            </button>
            <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-[var(--surface-muted)] p-1 text-sm">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`rounded-lg px-3 py-2 ${mode === "signin" ? "bg-[var(--surface-elevated)] font-semibold" : "text-[var(--ink-soft)]"}`}
              >
                Connexion
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`rounded-lg px-3 py-2 ${mode === "signup" ? "bg-[var(--surface-elevated)] font-semibold" : "text-[var(--ink-soft)]"}`}
              >
                Creer un compte
              </button>
            </div>

            {checking ? (
              <p className="mt-5 text-sm text-[var(--ink-soft)]">{t("common.loading")}</p>
            ) : (
              <form onSubmit={onSubmit} className="mt-5 space-y-3">
                <label className="block text-sm font-semibold">
                  Email
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="input-shell mt-1"
                    autoComplete="username"
                    placeholder="user@domain.com"
                    required
                  />
                </label>
                <label className="block text-sm font-semibold">
                  {t("accountPage.sessionPrompt")}
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="input-shell mt-1"
                    autoComplete="current-password"
                    required
                  />
                </label>
                <button type="submit" disabled={loading} className="btn-primary w-full px-4 py-2.5 text-sm">
                  {loading
                    ? t("common.loading")
                    : mode === "signup"
                      ? "Creer mon compte"
                      : t("accountPage.sessionLogin")}
                </button>
              </form>
            )}

            <Link href="/mot-de-passe-oublie" className="mt-3 inline-block text-xs font-semibold text-[var(--accent)]">
              Mot de passe oublie ?
            </Link>
            {error ? <p className="status-error mt-3 rounded-xl px-3 py-2 text-sm">{error}</p> : null}
            {oauthError ? (
              <p className="status-error mt-3 rounded-xl px-3 py-2 text-sm">
                Echec de connexion OAuth: {oauthError}
              </p>
            ) : null}
          </article>
        </section>
      </div>
    </main>
  );
}
