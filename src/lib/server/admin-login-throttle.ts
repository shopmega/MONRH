type LoginAttempt = {
  count: number;
  firstAt: number;
  blockUntil: number;
};

const WINDOW_MS = 10 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const attempts = new Map<string, LoginAttempt>();

function now() {
  return Date.now();
}

export function getClientIdentifier(ip: string | null): string {
  if (!ip || ip.trim().length === 0) return "unknown";
  return ip.split(",")[0].trim();
}

export function isLoginBlocked(clientId: string): { blocked: boolean; retryAfterSeconds: number } {
  const entry = attempts.get(clientId);
  if (!entry) return { blocked: false, retryAfterSeconds: 0 };
  const current = now();
  if (entry.blockUntil > current) {
    return { blocked: true, retryAfterSeconds: Math.ceil((entry.blockUntil - current) / 1000) };
  }
  if (current - entry.firstAt > WINDOW_MS) {
    attempts.delete(clientId);
  }
  return { blocked: false, retryAfterSeconds: 0 };
}

export function recordFailedLogin(clientId: string) {
  const current = now();
  const entry = attempts.get(clientId);
  if (!entry || current - entry.firstAt > WINDOW_MS) {
    attempts.set(clientId, {
      count: 1,
      firstAt: current,
      blockUntil: 0,
    });
    return;
  }

  const nextCount = entry.count + 1;
  attempts.set(clientId, {
    count: nextCount,
    firstAt: entry.firstAt,
    blockUntil: nextCount >= MAX_ATTEMPTS ? current + BLOCK_MS : 0,
  });
}

export function clearLoginAttempts(clientId: string) {
  attempts.delete(clientId);
}
