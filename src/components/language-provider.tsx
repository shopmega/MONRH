"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { MESSAGES, type AppLanguage } from "@/lib/i18n/messages";

type MessageParams = Record<string, string | number>;

type LanguageContextType = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  locale: string;
  t: (key: string, params?: MessageParams) => string;
};

const LANGUAGE_STORAGE_KEY = "salarie_language";

const LanguageContext = createContext<LanguageContextType | null>(null);

function translate(language: AppLanguage, key: string, params?: MessageParams): string {
  const segments = key.split(".");
  const resolveValue = (sourceLanguage: AppLanguage) => {
    let value: unknown = MESSAGES[sourceLanguage];

    for (const segment of segments) {
      if (!value || typeof value !== "object" || !(segment in value)) {
        return null;
      }
      value = (value as Record<string, unknown>)[segment];
    }

    return typeof value === "string" ? value : null;
  };

  const value = resolveValue(language) ?? resolveValue("fr") ?? key;

  if (!params) {
    return value;
  }

  return Object.entries(params).reduce(
    (current, [paramKey, paramValue]) =>
      current.replaceAll(`{${paramKey}}`, String(paramValue)),
    value,
  );
}

export function LanguageProvider({
  children,
  initialLanguage = "fr",
}: {
  children: React.ReactNode;
  initialLanguage?: AppLanguage;
}) {
  const [language, setLanguage] = useState<AppLanguage>(initialLanguage);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (storedLanguage === "ar" || storedLanguage === "fr") {
      setLanguage(storedLanguage);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.cookie = `${LANGUAGE_STORAGE_KEY}=${language}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language, ready]);

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      locale: language === "ar" ? "ar-MA" : "fr-MA",
      t: (key: string, params?: MessageParams) => translate(language, key, params),
    }),
    [language],
  );

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }

  return context;
}
