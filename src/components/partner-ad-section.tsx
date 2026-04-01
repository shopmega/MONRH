"use client";

import { AdSlot } from "@/components/ad-slot";
import { useLanguage } from "@/components/language-provider";

interface PartnerAdSectionProps {
  slot: string;
  className?: string;
  children?: React.ReactNode;
}

export function PartnerAdSection({ slot, className, children }: PartnerAdSectionProps) {
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const { t } = useLanguage();

  // Only show the partner section if ads are actually served
  if (!adsenseClient) {
    return null;
  }

  return (
    <section className={className}>
      <p className="section-kicker pl-1">{t("common.partner")}</p>
      <div className="soft-card mt-2 rounded-3xl p-3">
        <AdSlot slot={slot} format="auto" />
      </div>
      {children}
    </section>
  );
}
