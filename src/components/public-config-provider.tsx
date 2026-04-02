"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ToolPolicy } from "@/lib/tools/tool-catalog";

type PublicConfig = {
  simulatorAdStepEnabled: boolean;
  documentAdStepEnabled: boolean;
  maintenanceMessage: string;
  websiteSettings: {
    siteName: string;
    siteDescription: string;
    siteSubtitle: string;
    logoUrl: string;
    supportEmail: string;
    defaultArticleCoverUrl: string;
    socialLinks: {
      facebook: string;
      instagram: string;
      linkedin: string;
      x: string;
    };
  };
  toolPolicies: Record<string, ToolPolicy>;
  userAuthenticated: boolean;
  updatedAt: string;
};

type PublicConfigContextValue = {
  config: PublicConfig;
  ready: boolean;
};

const defaultConfig: PublicConfig = {
  simulatorAdStepEnabled: true,
  documentAdStepEnabled: true,
  maintenanceMessage: "",
  websiteSettings: {
    siteName: "MON RH",
    siteDescription:
      "Salaire, CNSS, litiges et modeles RH pour les salaries au Maroc, avec articles juridiques clairs.",
    siteSubtitle: "Labour Clarity Platform",
    logoUrl: "",
    supportEmail: "",
    defaultArticleCoverUrl: "",
    socialLinks: {
      facebook: "",
      instagram: "",
      linkedin: "",
      x: "",
    },
  },
  toolPolicies: {},
  userAuthenticated: false,
  updatedAt: new Date(0).toISOString(),
};

const PublicConfigContext = createContext<PublicConfigContextValue>({
  config: defaultConfig,
  ready: false,
});

export function PublicConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<PublicConfig>(defaultConfig);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadConfig() {
      try {
        const response = await fetch("/api/public-config");
        const data = (await response.json()) as { ok: boolean; config?: PublicConfig };
        if (!active || !data.ok || !data.config) return;
        setConfig(data.config);
      } finally {
        if (active) setReady(true);
      }
    }
    loadConfig().catch(() => {
      if (active) setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => ({ config, ready }), [config, ready]);
  return <PublicConfigContext.Provider value={value}>{children}</PublicConfigContext.Provider>;
}

export function usePublicConfig() {
  return useContext(PublicConfigContext);
}
