"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/components/language-provider";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function sanitizeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/")) return "/compte";
  if (value.startsWith("//")) return "/compte";
  return value;
}

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function oauthCallbackUrl(nextPath: string) {
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
}

function oauthErrorMessage(provider: "Google" | "LinkedIn", message?: string) {
  return message
    ? `Connexion ${provider} impossible: ${message}`
    : `Connexion ${provider} impossible pour le moment.`;
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
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "linkedin_oidc",
        options: {
          redirectTo: oauthCallbackUrl(nextPath),
        },
      });

      if (signInError) {
        setError(oauthErrorMessage("LinkedIn", signInError.message));
      }
    } catch {
      setError(oauthErrorMessage("LinkedIn"));
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    setLoading(true);
    setError(undefined);
    try {
      const supabase = createSupabaseClient();
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: oauthCallbackUrl(nextPath),
        },
      });

      if (signInError) {
        setError(oauthErrorMessage("Google", signInError.message));
      }
    } catch {
      setError(oauthErrorMessage("Google"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[var(--background)] p-6 text-[var(--foreground)] selection:bg-[var(--juris-primary-container)] selection:text-[var(--juris-on-primary)]">
      {/* Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-atmos pointer-events-none opacity-30" />
      
      <div className="mx-auto w-full max-w-6xl relative z-10">
        <section className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] items-center">
          {/* Editorial Welcome Card */}
          <article className="relative hidden overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-16 shadow-2xl shadow-black/5 lg:flex lg:flex-col">
            <div className="absolute top-0 right-0 w-64 h-64 bg-atmos opacity-10 pointer-events-none" />
            <span className="inline-flex items-center rounded-full bg-[var(--juris-surface-container)] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--juris-primary)] mb-10 w-fit">
              {t("accountPage.kicker")}
            </span>
            <h1 className="text-6xl font-extrabold tracking-tight text-[var(--juris-on-surface)] font-display leading-[0.95] mb-8">
              L'excellence RH, <br/>à votre portée.
            </h1>
            <p className="text-xl text-[var(--juris-on-surface-variant)] font-medium leading-relaxed opacity-80 mb-12">
              {t("accountPage.description")}
            </p>
            
            <div className="space-y-6">
              {[
                "Accédez à vos simulations et documents sauvegardés.",
                "Conservez l'historique de vos audits légaux.",
                "Bénéficiez d'une veille juridique personnalisée."
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full bg-[var(--juris-primary-container)] flex items-center justify-center text-[var(--juris-primary)]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-base font-bold text-[var(--juris-on-surface)] opacity-70">{item}</span>
                </div>
              ))}
            </div>
          </article>

          {/* Login Control Card */}
          <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)]/90 p-10 shadow-2xl shadow-black/10 backdrop-blur-xl sm:p-12">
            <div className="mb-10">
              <h2 className="text-3xl font-extrabold text-[var(--juris-on-surface)] font-display mb-2">{t("accountPage.sessionLogin")}</h2>
              <p className="text-sm text-[var(--juris-on-surface-variant)] font-medium opacity-60">
                Gérez votre conformité en un clic.
              </p>
            </div>

            <div className="grid gap-3">
              <button
                type="button"
                onClick={signInWithGoogle}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] py-4 font-bold text-[var(--heading)] transition-all hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] active:scale-[0.99] disabled:opacity-50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M21.6 12.23c0-.73-.07-1.43-.19-2.11H12v3.99h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.23c1.89-1.74 2.98-4.3 2.98-7.41Z" />
                  <path fill="#34A853" d="M12 22c2.7 0 4.96-.89 6.62-2.36l-3.23-2.51c-.9.6-2.04.95-3.39.95-2.6 0-4.81-1.76-5.6-4.12H3.06v2.59A10 10 0 0 0 12 22Z" />
                  <path fill="#FBBC05" d="M6.4 13.96a6 6 0 0 1 0-3.92V7.45H3.06a10 10 0 0 0 0 9.1l3.34-2.59Z" />
                  <path fill="#EA4335" d="M12 5.92c1.47 0 2.79.51 3.83 1.5l2.86-2.86A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.94 5.45l3.34 2.59C7.19 7.68 9.4 5.92 12 5.92Z" />
                </svg>
                {loading ? t("common.loading") : "Continuer avec Google"}
              </button>

              <button
                type="button"
                onClick={signInWithLinkedIn}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] py-4 font-bold text-[var(--heading)] transition-all hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] active:scale-[0.99] disabled:opacity-50"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                {loading ? t("common.loading") : "Continuer avec LinkedIn"}
              </button>
            </div>

            <div className="my-10 flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--juris-on-surface-variant)] opacity-30">
              <div className="h-px bg-current flex-grow" />
              <span>Ou avec email</span>
              <div className="h-px bg-current flex-grow" />
            </div>

            <div className="mb-10 grid grid-cols-2 gap-2 rounded-lg bg-[var(--surface-muted)] p-1.5">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`rounded-lg py-3 text-xs font-bold uppercase tracking-widest transition-all ${mode === "signin" ? "bg-[var(--surface)] text-[var(--juris-primary)] shadow-sm" : "text-[var(--juris-on-surface-variant)] opacity-70"}`}
              >
                Connexion
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`rounded-lg py-3 text-xs font-bold uppercase tracking-widest transition-all ${mode === "signup" ? "bg-[var(--surface)] text-[var(--juris-primary)] shadow-sm" : "text-[var(--juris-on-surface-variant)] opacity-70"}`}
              >
                Créer
              </button>
            </div>

            {checking ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-[var(--juris-primary)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-[var(--juris-on-surface-variant)] opacity-60">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="username"
                    placeholder="votre@email.com"
                    required
                    className="h-14 rounded-lg border border-[var(--line)] bg-[var(--input-bg)] px-6 text-[var(--foreground)] focus:ring-2 focus:ring-[var(--juris-primary)]"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" title={t("accountPage.sessionPrompt")} className="text-[10px] font-bold uppercase tracking-widest text-[var(--juris-on-surface-variant)] opacity-60">Mot de passe</Label>
                    <Link href="/mot-de-passe-oublie" className="text-[10px] font-bold text-[var(--juris-primary)] uppercase tracking-widest hover:underline">
                      Oublié ?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                    className="h-14 rounded-lg border border-[var(--line)] bg-[var(--input-bg)] px-6 text-[var(--foreground)] focus:ring-2 focus:ring-[var(--juris-primary)]"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="btn-primary w-full h-14 text-lg"
                >
                  {loading
                    ? t("common.loading")
                    : mode === "signup"
                      ? "Créer mon compte"
                      : "Se connecter"}
                </button>
              </form>
            )}

            {error ? <p className="mt-6 rounded-lg border border-[var(--err)] bg-[var(--err-bg)] p-4 text-sm font-bold text-[var(--err)]">{error}</p> : null}
            {oauthError ? (
              <p className="mt-6 rounded-lg border border-[var(--err)] bg-[var(--err-bg)] p-4 text-sm font-bold text-[var(--err)]">
                Échec LinkedIn: {oauthError}
              </p>
            ) : null}
          </article>
        </section>
      </div>
    </main>
  );
}
