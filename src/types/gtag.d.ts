declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
    __gaEventQueue?: Array<{
      eventName: string;
      params: Record<string, string | number | boolean>;
    }>;
  }
}

export {};
