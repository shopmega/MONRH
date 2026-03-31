import { NextRequest, NextResponse } from "next/server";
import { resolveRelatedItems } from "@/lib/linking/resolve-related";
import { isUserAuthenticated } from "@/lib/server/user-session";
import type { LinkSourceType } from "@/lib/linking/link-map";

function parseSourceType(value: string | null): LinkSourceType | null {
  if (value === "article" || value === "simulator" || value === "document") {
    return value;
  }
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sourceType = parseSourceType(searchParams.get("sourceType"));
  const sourceId = searchParams.get("sourceId");
  const userAuthenticated = await isUserAuthenticated();

  if (!sourceType || !sourceId) {
    return NextResponse.json({ ok: false, error: "invalid_query" }, { status: 400 });
  }

  const items = await resolveRelatedItems({ sourceType, sourceId, userAuthenticated });
  return NextResponse.json({ ok: true, items });
}
