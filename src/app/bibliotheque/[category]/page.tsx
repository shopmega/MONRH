import { redirect } from "next/navigation";

export default async function LegacyCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  redirect(`/bibliotheque?category=${encodeURIComponent(category)}`);
}
