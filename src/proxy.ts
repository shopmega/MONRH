import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

function requiredEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY"): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  const normalized = value.trim();
  if (
    normalized.includes("your-project-id.supabase.co") ||
    normalized === "your-anon-key" ||
    normalized === "your-service-role-key"
  ) {
    throw new Error(`Invalid placeholder environment variable: ${name}`);
  }
  return normalized;
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  let supabase: ReturnType<typeof createServerClient> | null = null;
  try {
    supabase = createServerClient(
      requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
      requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options as CookieOptions),
            );
          },
        },
      },
    );
  } catch {
    return response;
  }

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/compte/:path*",
    "/dashboard/:path*",
    "/api/admin/:path*",
    "/api/cases/:path*",
    "/api/contracts/generate",
    "/api/contracts/user",
    "/api/documents/generated",
    "/api/evidence-artifacts",
    "/api/journal/:path*",
    "/api/protection/:path*",
    "/api/user/:path*",
    "/journal/:path*",
  ],
};
