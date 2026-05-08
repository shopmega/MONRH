"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const { language } = useLanguage();
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
        setError(language === "ar" ? "تعذر الإرسال. تحقق من البريد الإلكتروني ثم حاول مجدداً." : "Envoi impossible. Verifiez l'email puis reessayez.");
        return;
      }

      setStatus(language === "ar" ? "تم إرسال البريد الإلكتروني. افتح الرابط المستلم لتعيين كلمة مرور جديدة." : "Email envoye. Ouvrez le lien recu pour definir un nouveau mot de passe.");
    } catch {
      setError(language === "ar" ? "خطأ في الشبكة. حاول مجدداً." : "Erreur reseau. Reessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="paper-bg min-h-screen">
      <div className="mx-auto w-full max-w-md px-4 pb-10 pt-10 sm:px-6">
        <section className="soft-card rounded-3xl p-6">
          <p className="section-kicker">{language === "ar" ? "استعادة" : "Recuperation"}</p>
          <h1 className="display-font mt-2 text-3xl font-semibold">{language === "ar" ? "نسيت كلمة المرور" : "Mot de passe oublie"}</h1>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            {language === "ar" ? "أدخل بريدك الإلكتروني لتلقي رابط إعادة التعيين." : "Entrez votre email pour recevoir un lien de reinitialisation."}
          </p>

          <form onSubmit={onSubmit} className="mt-5 space-y-6">
            <div className="space-y-3">
              <Label htmlFor="email">{language === "ar" ? "البريد الإلكتروني" : "Email"}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (language === "ar" ? "جاري الإرسال..." : "Envoi...") : (language === "ar" ? "إرسال الرابط" : "Envoyer le lien")}
            </Button>
          </form>

          {status ? <p className="status-info mt-3 rounded-xl px-3 py-2 text-sm">{status}</p> : null}
          {error ? <p className="status-error mt-3 rounded-xl px-3 py-2 text-sm">{error}</p> : null}

          <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-[var(--accent)]">
            {language === "ar" ? "العودة إلى تسجيل الدخول" : "Retour a la connexion"}
          </Link>
        </section>
      </div>
    </main>
  );
}
