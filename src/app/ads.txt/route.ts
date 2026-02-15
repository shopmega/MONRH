import { NextResponse } from "next/server";

const GOOGLE_CERT_ID = "f08c47fec0942fa0";

function extractPublisherId(client: string): string {
  const trimmed = client.trim();
  if (trimmed.startsWith("ca-pub-")) {
    return `pub-${trimmed.slice("ca-pub-".length)}`;
  }
  if (trimmed.startsWith("pub-")) {
    return trimmed;
  }
  return "";
}

export async function GET() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() ?? "";
  const publisher = extractPublisherId(client);

  if (!publisher) {
    return new NextResponse("", {
      status: 204,
      headers: {
        "Cache-Control": "public, max-age=300",
      },
    });
  }

  const body = `google.com, ${publisher}, DIRECT, ${GOOGLE_CERT_ID}\n`;
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
