"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  AUDIENCE_MODE_STORAGE_KEY,
  AUDIENCE_QUERY_KEY,
  resolveAudienceMode,
  type AudienceMode,
} from "@/lib/audience/audience-mode";

type AudienceContextValue = {
  mode: AudienceMode;
  setMode: (mode: Exclude<AudienceMode, "unknown">) => void;
};

const AudienceContext = createContext<AudienceContextValue>({
  mode: "unknown",
  setMode: () => undefined,
});

function readBrowserMode(pathname: string) {
  if (typeof window === "undefined") {
    return resolveAudienceMode({ pathname });
  }

  const params = new URLSearchParams(window.location.search);
  return resolveAudienceMode({
    pathname,
    queryMode: params.get(AUDIENCE_QUERY_KEY),
    storedMode: window.localStorage.getItem(AUDIENCE_MODE_STORAGE_KEY),
  });
}

export function AudienceProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mode, setResolvedMode] = useState<AudienceMode>(() => resolveAudienceMode({ pathname }));

  useEffect(() => {
    const nextMode = readBrowserMode(pathname);
    setResolvedMode(nextMode);
    if (nextMode !== "unknown") {
      window.localStorage.setItem(AUDIENCE_MODE_STORAGE_KEY, nextMode);
    }
  }, [pathname]);

  const value = useMemo<AudienceContextValue>(
    () => ({
      mode,
      setMode(nextMode) {
        setResolvedMode(nextMode);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(AUDIENCE_MODE_STORAGE_KEY, nextMode);
        }
      },
    }),
    [mode],
  );

  return <AudienceContext.Provider value={value}>{children}</AudienceContext.Provider>;
}

export function useAudience() {
  return useContext(AudienceContext);
}
