"use client";

type AnalyticsPayload = {
  type: string;
  path: string;
  locale?: string;
  meta?: Record<string, unknown>;
};

type GtagParams = Record<string, string | number | boolean>;
type QueuedEvent = { eventName: string; params: GtagParams };

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
  if (typeof window.gtag !== "function") {
    window.__gaEventQueue = window.__gaEventQueue ?? [];
    window.__gaEventQueue.push({ eventName, params });
    return;
  }

  if (window.__gaEventQueue && window.__gaEventQueue.length > 0) {
    for (const item of window.__gaEventQueue as QueuedEvent[]) {
      window.gtag("event", item.eventName, item.params);
    }
    window.__gaEventQueue = [];
  }

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
