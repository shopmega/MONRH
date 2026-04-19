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
  },
  {
    slug: "salaire-brut-net-maroc-calcul",
    title: "Salaire Brut Net Maroc: Calcul Simple",
    description: "Calculez votre salaire brut en net au Maroc avec CNSS, AMO, IR et estimation du cout employeur.",
    content: `## Calculer un salaire brut en net au Maroc
Le passage du brut au net depend des cotisations sociales, de l'AMO, de l'IR et parfois d'avantages ou retenues propres au contrat.

### Ce que le simulateur verifie
- Le salaire brut ou net de depart.
- Les cotisations salariales.
- Le revenu imposable.
- L'impot sur le revenu estime.
- Le cout employeur indicatif.

Utilisez le simulateur pour comparer rapidement un salaire brut annonce dans une offre et le montant net attendu chaque mois.`,
    faqs: [
      {
        question: "Quelle est la difference entre salaire brut et salaire net au Maroc ?",
        answer: "Le brut correspond au salaire avant retenues. Le net correspond au montant apres cotisations sociales et impot sur le revenu.",
      },
      {
        question: "Puis-je calculer un net vers brut ?",
        answer: "Oui. Le simulateur MON RH permet de partir du net souhaite pour estimer le brut necessaire.",
      },
    ],
    simulatorType: "net_gross",
    simulatorPath: "/simulateurs/brut-net",
  },
  {
    slug: "ir-cnss-maroc",
    title: "IR et CNSS au Maroc: Calcul et Explication",
    description: "Comprenez l'impact de l'IR et des cotisations CNSS sur votre salaire au Maroc.",
    content: `## IR et CNSS au Maroc
L'IR et les cotisations sociales expliquent une grande partie de l'ecart entre salaire brut et salaire net.

### Points a controler
- La base imposable.
- Les cotisations sociales retenues.
- Le taux effectif d'impot.
- L'impact d'un bonus ou d'un 13e mois.

Pour une lecture plus precise, lancez le calcul IR annuel puis comparez avec le simulateur brut net.`,
    faqs: [
      {
        question: "La CNSS reduit-elle le salaire imposable ?",
        answer: "Les cotisations sociales entrent dans le calcul du revenu imposable selon les regles applicables.",
      },
      {
        question: "L'IR mensuel suffit-il pour estimer l'impot annuel ?",
        answer: "Pas toujours. Les bonus, primes et mois supplementaires peuvent changer le resultat annuel.",
      },
    ],
    simulatorType: "annual_income_tax",
    simulatorPath: "/simulateurs/ir-annuel",
  },
  {
    slug: "demissionner-au-maroc-droits",
    title: "Demissionner au Maroc: Droits, Preavis et Solde",
    description: "Verifiez vos droits apres demission au Maroc: preavis, conges restants et documents utiles.",
    content: `## Demissionner au Maroc sans perdre de visibilite
Une demission doit etre preparee: preavis, date de depart, conges restants et documents de sortie.

### A verifier avant d'envoyer la lettre
- La duree de preavis applicable.
- Les conges non pris.
- Les montants deja payes.
- Les documents a recuperer a la sortie.

Le simulateur permet d'estimer l'impact financier et de preparer les prochaines demarches.`,
    faqs: [
      {
        question: "Une demission donne-t-elle droit a une indemnite de licenciement ?",
        answer: "Non. En principe, la demission ne donne pas droit a l'indemnite legale de licenciement.",
      },
      {
        question: "Dois-je executer mon preavis apres demission ?",
        answer: "Oui, sauf accord contraire ou situation particuliere. Le simulateur aide a estimer la duree applicable.",
      },
    ],
    simulatorType: "demission",
    simulatorPath: "/simulateurs/demission",
  },
  {
    slug: "preavis-demission-maroc",
    title: "Preavis Demission Maroc: Calcul de la Duree",
    description: "Calculez votre preavis de demission au Maroc selon contrat, categorie et anciennete.",
    content: `## Calculer le preavis de demission au Maroc
Le preavis depend du type de contrat, de la categorie professionnelle et de l'anciennete.

### Pourquoi le calcul compte
- Il fixe la date de sortie realiste.
- Il limite les litiges sur le solde de tout compte.
- Il aide a rediger une lettre coherente.

Renseignez votre situation pour obtenir une estimation claire de la duree de preavis.`,
    faqs: [
      {
        question: "Le preavis est-il identique pour tous les salaries ?",
        answer: "Non. Il varie selon la categorie, le contrat et l'anciennete.",
      },
      {
        question: "Que se passe-t-il si le preavis n'est pas effectue ?",
        answer: "Une compensation peut etre discutee selon la situation et les accords entre les parties.",
      },
    ],
    simulatorType: "duree_preavis",
    simulatorPath: "/simulateurs/duree-preavis",
  },
  {
    slug: "droits-apres-demission-maroc",
    title: "Droits Apres Demission au Maroc",
    description: "Controlez vos droits apres demission: preavis, conges, solde de tout compte et documents de sortie.",
    content: `## Droits apres demission au Maroc
Apres une demission, les principaux points a verifier sont le preavis, les conges restants, les sommes dues et les documents remis par l'employeur.

### Parcours conseille
1. Simuler l'impact de la demission.
2. Calculer le preavis.
3. Controler le solde de tout compte.
4. Generer les documents utiles.

Cette page relie les outils MON RH pour couvrir toute la sortie.`,
    faqs: [
      {
        question: "Quels montants verifier apres demission ?",
        answer: "Verifiez notamment le salaire restant, les conges non pris, les primes dues et les retenues appliquees.",
      },
      {
        question: "Quel outil utiliser en premier ?",
        answer: "Commencez par le simulateur de demission, puis utilisez le calcul de preavis et l'audit de solde de tout compte.",
      },
    ],
    simulatorType: "demission",
    simulatorPath: "/simulateurs/demission",
  },
  {
    slug: "lettre-demission-maroc",
    title: "Lettre de Demission Maroc: Modele et Preavis",
    description: "Preparez une lettre de demission au Maroc et verifiez le preavis avant de l'envoyer.",
    content: `## Lettre de demission au Maroc
Une lettre de demission doit identifier le salarie, l'employeur, la date d'envoi et la date de depart souhaitee.

### Avant de generer la lettre
- Calculez le preavis.
- Confirmez la date de depart.
- Gardez une preuve d'envoi.
- Preparez les demandes de documents de sortie.

Le generateur de document permet de passer d'une estimation a une lettre exploitable.`,
    faqs: [
      {
        question: "La lettre de demission doit-elle mentionner le motif ?",
        answer: "Le motif n'est pas toujours necessaire. La lettre doit surtout etre claire sur la volonte de demissionner et la date.",
      },
      {
        question: "Puis-je demander une dispense de preavis ?",
        answer: "Oui, mais elle doit idealement etre acceptee par l'employeur pour eviter un litige.",
      },
    ],
    simulatorType: "demission",
    simulatorPath: "/documents/resignation-letter",
  },
  {
    slug: "clause-abusive-contrat-maroc",
    title: "Clause Abusive Contrat Maroc: Points a Verifier",
    description: "Identifiez les clauses sensibles dans un contrat de travail au Maroc et les outils utiles pour agir.",
    content: `## Clause abusive dans un contrat au Maroc
Certaines clauses peuvent creer un desequilibre ou limiter excessivement les droits du salarie.

### Clauses a relire avec attention
- Mobilite ou changement de poste.
- Non-concurrence.
- Retenues salariales.
- Periode d'essai.
- Rupture ou sanction disciplinaire.

MON RH ne remplace pas un conseil juridique, mais aide a preparer les questions et documents utiles avant d'agir.`,
    faqs: [
      {
        question: "Une clause abusive est-elle automatiquement nulle ?",
        answer: "La qualification depend du contexte, du contrat et des textes applicables. Il faut analyser la clause precise.",
      },
      {
        question: "Quel outil MON RH utiliser ?",
        answer: "Commencez par les outils de controle de procedure, de contrat et de pre-contentieux selon le probleme rencontre.",
      },
    ],
    simulatorType: "contract_review",
    simulatorPath: "/contrat",
  },
  {
    slug: "droits-salarie-maroc",
    title: "Droits Salarie Maroc: Outils et Demarches",
    description: "Retrouvez les principaux droits du salarie au Maroc: salaire, contrat, conges, CNSS, demission et litiges.",
    content: `## Droits du salarie au Maroc
Les droits du salarie couvrent le salaire, le contrat, les conges, la CNSS, la rupture du contrat et les recours en cas de litige.

### Les controles utiles
- Salaire brut net et IR.
- Indemnite de licenciement.
- Preavis et demission.
- Conges et protection sociale.
- Solde de tout compte.

Utilisez cette page comme point d'entree vers les simulateurs et modeles MON RH.`,
    faqs: [
      {
        question: "Quels droits verifier en priorite ?",
        answer: "Commencez par le salaire, le contrat, les conges, le preavis et les montants dus en cas de depart.",
      },
      {
        question: "MON RH couvre-t-il les litiges ?",
        answer: "Oui. Des outils aident a structurer les reclamations, preuves et etapes avant escalade.",
      },
    ],
    simulatorType: "rights_hub",
    simulatorPath: "/outils",
  }
];
