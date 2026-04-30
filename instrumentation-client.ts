import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const tracesSampleRate = Number(
  process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ??
    (process.env.NODE_ENV === "development" ? "1.0" : "0.1"),
);
const replaysSessionSampleRate = Number(
  process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE ?? "0.1",
);
const replaysOnErrorSampleRate = Number(
  process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE ?? "1.0",
);

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    enableLogs: true,
    sendDefaultPii: false,
    tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0.1,
    replaysSessionSampleRate: Number.isFinite(replaysSessionSampleRate)
      ? replaysSessionSampleRate
      : 0.1,
    replaysOnErrorSampleRate: Number.isFinite(replaysOnErrorSampleRate)
      ? replaysOnErrorSampleRate
      : 1.0,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    ignoreErrors: [
      "ResizeObserver loop completed with undelivered notifications.",
      "ResizeObserver loop limit exceeded",
    ],
    denyUrls: [
      /extensions\//i,
      /^chrome:\/\//i,
      /^moz-extension:\/\//i,
      /^safari-extension:\/\//i,
    ],
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
