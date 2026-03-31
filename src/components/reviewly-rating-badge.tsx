"use client";

import Link from "next/link";

const AVIS_SITE_URL = process.env.NEXT_PUBLIC_AVIS_SITE_URL?.replace(/\/$/, "") || "https://avisine.com";

export function ReviewlyRatingBadge({
  companyName,
  businessId,
  rating,
}: {
  companyName: string;
  businessId: string;
  rating: number;
}) {
  const href = `${AVIS_SITE_URL}/companies/${businessId}`;

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface-muted)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
    >
      <span className="font-semibold text-[var(--ink-soft)]">AVISINE</span>
      <span aria-hidden>&#9733;</span>
      <span>{rating.toFixed(1)}</span>
      <span className="text-[var(--ink-soft)]">&middot;</span>
      <span className="max-w-[120px] truncate" title={companyName}>
        {companyName}
      </span>
    </Link>
  );
}
