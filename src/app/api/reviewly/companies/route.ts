import { NextRequest, NextResponse } from "next/server";
import { searchCompanies } from "@/lib/avis-api";

const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 100;
const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 20;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q")?.trim() ?? "";
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(MAX_LIMIT, Math.max(1, parseInt(limitParam, 10) || DEFAULT_LIMIT)) : DEFAULT_LIMIT;
  const city = searchParams.get("city")?.trim() || undefined;
  const category = searchParams.get("category")?.trim() || undefined;

  if (q.length < MIN_QUERY_LENGTH) {
    return NextResponse.json(
      { results: [], query: q, message: "Query must be at least 2 characters" },
      { status: 200 },
    );
  }

  if (q.length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      { results: [], query: q, message: "Query must be at most 100 characters" },
      { status: 200 },
    );
  }

  try {
    const data = await searchCompanies(q, { limit, city, category });
    return NextResponse.json({
      results: data.results,
      query: data.query,
      pagination: data.pagination,
    });
  } catch (error) {
    console.error("[reviewly/companies]", error);
    return NextResponse.json(
      { results: [], query: q, error: "Search temporarily unavailable" },
      { status: 502 },
    );
  }
}
