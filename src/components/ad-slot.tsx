"use client";

import { useEffect, useRef } from "react";
import { useLanguage } from "@/components/language-provider";

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

type AdSlotProps = {
  className?: string;
  slot: string;
  format?: "auto" | "fluid" | string;
  responsive?: boolean;
};

export function AdSlot({
  className,
  slot,
  format = "auto",
  responsive = true,
}: AdSlotProps) {
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const { t } = useLanguage();
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!adsenseClient) {
      return;
    }

    const root = rootRef.current;
    const adNode = root?.querySelector("ins.adsbygoogle") as HTMLElement | null;
    if (!adNode) {
      return;
    }

    if (adNode.dataset.adInitialized === "1" || adNode.getAttribute("data-adsbygoogle-status")) {
      return;
    }

    adNode.dataset.adInitialized = "1";

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch {
      // Ignore runtime ad-loader errors in local/dev.
    }
  }, [adsenseClient, format, responsive, slot]);

  if (!adsenseClient) {
    return (
      <div className={className}>
        <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface)] px-4 py-8 text-center text-xs text-[var(--ink-soft)]">
          {t("ad.placeholder")}
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className={className}>
      <ins
        className="adsbygoogle block min-h-24 w-full overflow-hidden rounded-2xl bg-white"
        data-ad-client={adsenseClient}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}
