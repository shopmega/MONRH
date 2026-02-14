"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/language-provider";
import { trackPageView } from "@/lib/analytics/client";

export function AnalyticsTracker() {
  const pathname = usePathname();
  const { locale } = useLanguage();

  useEffect(() => {
    trackPageView(pathname, locale);
  }, [pathname, locale]);

  return null;
}
