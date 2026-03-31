"use client";

import { useEffect } from "react";

export function PwaRegistration() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          if (reg.installing) reg.installing.addEventListener("statechange", checkState);
          else if (reg.waiting) checkState({ target: reg.waiting });
          function checkState(e: { target?: ServiceWorker | null | undefined } | Event) {
            const sw = (e as any)?.target as ServiceWorker | undefined;
            if (sw?.state === "installed" && navigator.serviceWorker.controller) {
              // New content available; could show "Update available" toast here
            }
          }
        })
        .catch(() => {});
    }
  }, []);
  return null;
}
