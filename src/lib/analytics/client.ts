"use client";

type AnalyticsPayload = {
  type: string;
  path: string;
  locale?: string;
  meta?: Record<string, unknown>;
};

type GtagParams = Record<string, string | number | boolean>;

function sanitizeMeta(meta?: Record<string, unknown>): GtagParams {
  if (!meta) return {};
  const output: GtagParams = {};
  for (const [key, value] of Object.entries(meta)) {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      output[key] = value;
    }
  }
  return output;
}

function sendGaEvent(eventName: string, params: GtagParams) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  window.gtag("event", eventName, params);
}

export function trackPageView(path: string, locale?: string) {
  sendGaEvent("page_view", {
    page_path: path,
    page_title: typeof document !== "undefined" ? document.title : "",
    language: locale ?? "",
  });
}

export function trackEvent(payload: AnalyticsPayload) {
  sendGaEvent(payload.type, {
    page_path: payload.path,
    language: payload.locale ?? "",
    ...sanitizeMeta(payload.meta),
  });
}
