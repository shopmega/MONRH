"use client";

interface AdminFetchResult<T> {
  data: T | null;
  error: string | null;
}

export async function adminFetch<T>(
  url: string,
  options?: RequestInit
): Promise<AdminFetchResult<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json", ...options?.headers },
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      return {
        data: null,
        error: body.error || `Erreur serveur (${response.status})`,
      };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur réseau",
    };
  }
}
