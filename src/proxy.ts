import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/server/admin-auth";

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

// Simple in-memory rate limiter (for development)
// In production, use Redis or a proper rate limiting service
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

async function checkRateLimit(ip: string, limit = 10, windowMs = 60000): Promise<{ allowed: boolean }> {
  const now = Date.now();
  const existing = rateLimitStore.get(ip);

  if (!existing || now > existing.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return { allowed: true };
  }

  if (existing.count >= limit) {
    return { allowed: false };
  }

  existing.count++;
  return { allowed: true };
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limiting for public-config API
  if (pathname === '/api/public-config') {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const rateLimit = await checkRateLimit(ip);
    
    if (!rateLimit.allowed) {
      return new NextResponse('Too Many Requests', { 
        status: 429,
        headers: {
          'Retry-After': '60'
        }
      });
    }
  }

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
      // Return 404 instead of redirect to avoid revealing admin route existence
      return new NextResponse('Not Found', { status: 404 });
    }
  }

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
    "/employee",
    "/employer/:path*",
    "/api/admin/:path*",
    "/api/cases/:path*",
    "/api/contracts/generate",
    "/api/contracts/user",
    "/api/documents/generated",
    "/api/employer/:path*",
    "/api/evidence-artifacts",
    "/api/journal/:path*",
    "/api/protection/:path*",
    "/api/user/:path*",
    "/api/public-config",
    "/journal/:path*",
  ],
};
