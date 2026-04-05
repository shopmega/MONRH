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

    const initializeAd = () => {
      const rect = adNode.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        return false;
      }

      adNode.dataset.adInitialized = "1";

      try {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
        return true;
      } catch {
        // Ignore runtime ad-loader errors in local/dev.
        return true;
      }
    };

    // Try to initialize immediately
    if (initializeAd()) {
      return;
    }

    // If dimensions are not available, wait for them
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === adNode) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            initializeAd();
            resizeObserver.disconnect();
            break;
          }
        }
      }
    });

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName === "data-ad-status") {
          const status = adNode.getAttribute("data-ad-status");
          if (status === "unfilled") {
            adNode.style.display = "none";
            if (root) root.style.display = "none";
          } else if (status === "filled") {
            adNode.style.display = "block";
            if (root) root.style.display = "block";
          }
        }
      });
    });

    observer.observe(adNode, { attributes: true });

    resizeObserver.observe(adNode);

    return () => {
      resizeObserver.disconnect();
      observer.disconnect();
    };
  }, [adsenseClient, format, responsive, slot]);

  if (!adsenseClient) {
    return null;
  }

  return (
    <div ref={rootRef} className={className}>
      <ins
        ref={slotRef}
        className="adsbygoogle block w-full overflow-hidden"
        data-ad-client={adsenseClient}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
        style={{ minHeight: '1px' }}
      />
    </div>
  );
}
