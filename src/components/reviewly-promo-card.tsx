"use client";

import { useLanguage } from "@/components/language-provider";
import Link from "next/link";

export function ReviewlyPromoCard({
    type = "general"
}: {
    type?: "general" | "conflict" | "transition"
}) {
    const { language } = useLanguage();
    const isAr = language === "ar";

    const content = {
        general: {
            title: isAr ? "شارك تجربتك على Reviewly" : "Partagez votre expérience sur Reviewly",
            description: isAr
                ? "ساعد الموظفين الآخرين من خلال تقييم بيئة العمل في شركتك. صوتك مهم!"
                : "Aidez d'autres employés en évaluant l'environnement de travail de votre entreprise. Votre voix compte !",
            cta: isAr ? "اترك مراجعة" : "Laisser un avis",
        },
        conflict: {
            title: isAr ? "هل تواجه مشاكل؟" : "Vous rencontrez des problèmes ?",
            description: isAr
                ? "اكتشف ما إذا كان موظفون آخرون قد واجهوا مواقف مماثلة في هذه الشركة على Reviewly."
                : "Découvrez si d'autres employés ont vécu des situations similaires dans cette entreprise sur Reviewly.",
            cta: isAr ? "تحقق من المراجعات" : "Consulter les avis",
        },
        transition: {
            title: isAr ? "خطوة جديدة في مسارك؟" : "Nouvelle étape de carrière ?",
            description: isAr
                ? "قبل الانضمام لشركة جديدة، تحقق من سمعتها وتقييمات موظفيها الحقيقيين."
                : "Avant de rejoindre une nouvelle entreprise, vérifiez sa réputation et les avis de ses vrais employés.",
            cta: isAr ? "ابحث عن الشركة" : "Rechercher l'entreprise",
        }
    };

    const activeContent = content[type];

    return (
        <article className="soft-card overflow-hidden rounded-3xl border border-[var(--line)] bg-gradient-to-br from-[var(--surface)] to-[var(--surface-muted)] p-1">
            <div className="rounded-[1.4rem] bg-[var(--surface)] p-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)] text-white font-bold text-lg">
                        R
                    </div>
                    <div>
                        <h3 className="display-font font-semibold text-[var(--foreground)]">Reviewly</h3>
                        <p className="text-[10px] uppercase tracking-widest text-[var(--ink-soft)] font-bold">
                            {isAr ? "منصة مراجعات الشركات" : "Business Reviews Platform"}
                        </p>
                    </div>
                </div>

                <div className="mt-4">
                    <h4 className="font-semibold text-[var(--foreground)]">{activeContent.title}</h4>
                    <p className="mt-1 text-sm text-[var(--ink-soft)] leading-relaxed">
                        {activeContent.description}
                    </p>
                </div>

                <Link
                    href="https://reviewly-ma.vercel.app/"
                    target="_blank"
                    className="btn-primary mt-5 flex w-full items-center justify-center py-2.5 text-sm font-semibold transition-all hover:scale-[1.02]"
                >
                    {activeContent.cta}
                    <svg
                        className={`ms-2 h-4 w-4 ${isAr ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </Link>
            </div>
        </article>
    );
}
