import { NextResponse } from "next/server";
import { getCurrentAdminUser, isAdminAuthenticated } from "@/lib/server/admin-auth";

export async function GET() {
  const authenticated = await isAdminAuthenticated();
  const user = authenticated ? await getCurrentAdminUser() : null;
  return NextResponse.json({
    ok: true,
    authenticated,
    user: user ? { id: user.id, email: user.email ?? null } : null,
  });
}
