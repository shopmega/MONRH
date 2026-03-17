import { memo } from "react";

/**
 * Safely renders JSON-LD structured data in the head of the document.
 * We use `dangerouslySetInnerHTML` to inject the JSON string safely.
 */
export const JsonLd = memo(function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
});
