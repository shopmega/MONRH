import { type SimulatorField } from "@/components/simulator-tool-page";

export type FAQItem = {
  question: string;
  answer: string;
};

export type SeoGuide = {
  slug: string;
  title: string;
  description: string;
  content: string; // Markdown or HTML
  faqs: FAQItem[];
  simulatorType: string; // Matches the actual simulator category/type
  simulatorPath: string; // The URL to the simulator
};

/**
 * Programmatic SEO Library.
 * Each entry generates a unique page under `/sujets/[slug]`
 * specifically designed to capture long tail keywords.
 */
export const seoGuides: SeoGuide[] = [
  {
    slug: "calcul-indemnite-licenciement-maroc",
    title: "Calcul Indemnité Licenciement au Maroc (2026)",
    description: "Découvrez comment calculer votre indemnité de licenciement au Maroc. Formule légale, préavis et congés payés. Utilisez notre simulateur gratuit.",
    content: `## Comprendre l'Indemnité de Licenciement au Maroc
L'indemnité de licenciement au Maroc est un droit fondamental pour tout salarié en CDI justifiant d'au moins 6 mois d'ancienneté. Ce montant est calculé selon un barème progressif défini par le Code du Travail marocain.

### Le barème légal (Article 53)
- **96 heures** de salaire par année pour les 5 premières années.
- **144 heures** de salaire par année de la 6ème à la 10ème année.
- **192 heures** de salaire par année de la 11ème à la 15ème année.
- **240 heures** de salaire par année au-delà de 15 ans.

### Les autres composantes
Lors d'une rupture de contrat, l'indemnité de licenciement n'est pas la seule somme due. L'employeur doit également régler :
1. **L'indemnité de préavis** (si le préavis n'est pas effectué)
2. **L'indemnité compensatrice de congés payés**
3. **Les dommages et intérêts** (en cas de licenciement reconnu abusif par le tribunal)

Pour obtenir une estimation précise personnalisée à votre salaire et votre ancienneté, utilisez notre simulateur officiel ci-dessous.`,
    faqs: [
      {
        question: "Ai-je droit à l'indemnité de licenciement si je démissionne ?",
        answer: "Non, la démission n'ouvre pas droit à l'indemnité de licenciement selon le Code du Travail marocain. Vous percevrez uniquement le solde de tout compte (congés payés, prorata du 13ème mois)."
      },
      {
        question: "Comment calculer l'indemnité de licenciement sans avocat ?",
        answer: "Il suffit de prendre votre salaire de base, vos primes régulières, et de les multiplier par le barème horaire correspondant à votre ancienneté. Vous pouvez utiliser le simulateur gratuit de Salarie.ma pour obtenir le résultat exact en quelques secondes."
      }
    ],
    simulatorType: "licenciement",
    simulatorPath: "/simulateurs/licenciement",
  },
  {
    slug: "prime-precarite-cdd-maroc",
    title: "La Prime de Précarité CDD au Maroc",
    description: "Tout savoir sur l'indemnité de fin de contrat CDD (Prime de précarité) au Maroc. Ce qui est dit dans le Code du Travail.",
    content: `## Fin de CDD et Prime de Précarité au Maroc
Contrairement à la France, **le Code du Travail marocain ne prévoit pas de "prime de précarité" automatique** de 10% à la fin d'un Contrat à Durée Déterminée (CDD).

Cependant, à la fin de votre CDD, vous avez droit de manière obligatoire à votre **Solde de Tout Compte (STC)** qui inclut les éléments suivants :

### Ce que votre employeur doit vous payer :
1. **Le salaire des jours travaillés** ce mois-ci.
2. **L'indemnité de congés payés non consommés** (1,5 jour par mois travaillé ou 2 jours pour les -18 ans).
3. **Le prorata du 13ème mois** (si cela est prévu par votre contrat de travail ou la convention collective).

### Rupture anticipée du CDD
Si l'employeur rompt le CDD avant son terme (sans faute grave de votre part), il est tenu de vous payer **la totalité des salaires que vous auriez perçus jusqu'à la fin prévue du contrat**. C'est ce qu'on appelle les dommages et intérêts pour rupture anticipée.

Utilisez notre simulateur de fin de CDD pour calculer exactement ce que votre employeur vous doit à la fin de votre contrat.`,
    faqs: [
      {
        question: "Puis-je toucher une indemnité de licenciement à la fin de mon CDD ?",
        answer: "Non, la fin d'un CDD n'est pas un licenciement mais l'arrivée à terme du contrat. Elle n'ouvre donc pas droit à l'indemnité légale de licenciement."
      },
      {
        question: "Que se passe-t-il si je continue de travailler après la fin de mon CDD ?",
        answer: "Si vous continuez à travailler après l'échéance de votre CDD avec l'accord (même tacite) de votre employeur, le Code du Travail considère que votre contrat s'est automatiquement transformé en CDI."
      }
    ],
    simulatorType: "fin-cdd",
    simulatorPath: "/simulateurs/fin-cdd",
  }
];
