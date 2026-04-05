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
  const slotRef = useRef<HTMLModElement | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);


  useEffect(() => {
    if (!adsenseClient) {
      return;
    }

    const root = rootRef.current;
    const adNode = slotRef.current;
    if (!adNode || !root) {
      return;
    }

    if (adNode.dataset.adInitialized === "1" || adNode.getAttribute("data-adsbygoogle-status")) {
      return;
    }

    const initializeAd = () => {
      if (adNode.dataset.adInitialized === "1") return true;
      const rect = adNode.getBoundingClientRect();
      // Only push if there's space; otherwise AdSense might throw an error or not load
      // But for responsive, we just push and let it figure it out
      adNode.dataset.adInitialized = "1";

      try {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
        return true;
      } catch {
        return true;
      }
    };

    // 1. Initial attempt
    initializeAd();

    // 2. Observer for explicit unfilled status
    observerRef.current = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName === "data-ad-status") {
          const status = adNode.getAttribute("data-ad-status");
          if (status === "unfilled") {
            adNode.style.display = "none";
            root.style.display = "none";
          }
        }
      });
    });

    observerRef.current.observe(adNode, { attributes: true });

    // 3. Fallback: Check after 5 seconds if anything actually loaded
    timeoutRef.current = setTimeout(() => {
      const iframe = adNode.querySelector('iframe');
      const hasContent = iframe && (iframe.offsetHeight > 0 || iframe.dataset.adStatus === 'filled');
      const adStatus = adNode.getAttribute('data-ad-status');
      
      if (!hasContent && adStatus !== 'filled') {
        // If it's not explicitly filled, and we don't see a visible iframe, collapse.
        adNode.style.display = "none";
        root.style.display = "none";
      }
    }, 5000);

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [adsenseClient, slot]);

  if (!adsenseClient) {
    return null;
  }

  return (
    <div ref={rootRef} className={className} style={{ display: 'block' }}>
      <ins
        ref={slotRef}
        className="adsbygoogle block"
        data-ad-client={adsenseClient}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
        style={{ display: 'block', height: 'auto' }}
      />
    </div>
  );
}

