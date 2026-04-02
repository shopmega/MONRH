export type Category = {
  slug: string;
  name: string;
  count: number;
  description: string;
  href: string;
};

export type Feature = {
  title: string;
  description: string;
  href: string;
};

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  categorySlug: string;
  readingTime: string;
  lastUpdated: string;
  content: string[];
  isActive?: boolean;
  access?: "public" | "logged";
  thumbnailUrl?: string;
  coverImageUrl?: string;
  href: string;
};

export type DocumentTemplate = {
  id: string;
  title: string;
  description: string;
  fields: Array<{
    id: string;
    label: string;
    placeholder: string;
    type?: "text" | "date" | "datetime-local" | "company";
  }>;
  href: string;
};

export const features: Feature[] = [
  {
    title: "Calculs Verifiables",
    description:
      "Chaque resultat affiche la version legale, les charges appliquees et le detail de la formule.",
    href: "/salaire",
  },
  {
    title: "Documents Conformes",
    description:
      "Lettres pre-remplies avec references juridiques et export en format imprimable.",
    href: "/modeles",
  },
  {
    title: "Suivi Personnel",
    description:
      "Suivez anciennete, conges estimes et historique des simulations depuis votre espace.",
    href: "/compte",
  },
];
