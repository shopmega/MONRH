"use client";

import { useLanguage } from "@/components/language-provider";
import { Star } from "lucide-react";

export function AvisineRatingBadge({
  rating,
  reviewCount,
}: {
  rating: number | null | undefined;
  reviewCount?: number;
}) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  if (rating === null || rating === undefined) return null;

  return (
    <div className="flex items-center gap-1.5 rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--foreground)] border border-[var(--line)]">
      <Star className="h-3 w-3 fill-[var(--accent)] text-[var(--accent)]" />
      <span>{rating.toFixed(1)}</span>
      {reviewCount !== undefined && (
        <span className="text-[10px] text-[var(--ink-soft)] ml-0.5">
          ({reviewCount} {isAr ? "آراء" : "avis"})
        </span>
      )}
    </div>
  );
}
