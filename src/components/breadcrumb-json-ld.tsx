import { JsonLd } from "@/components/json-ld";
import { SITE_NAME, absoluteUrl } from "@/lib/seo";

type BreadcrumbItem = {
  name: string;
  href: string;
};

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  const chain = [{ name: SITE_NAME, href: "/" }, ...items];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: chain.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.href),
    })),
  };
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  return <JsonLd data={buildBreadcrumbJsonLd(items)} />;
}
