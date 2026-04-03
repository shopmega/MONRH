export type IntentPageLink = {
  title: string;
  description: string;
  href: string;
};

export type IntentPageDefinition = {
  title: string;
  kicker: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  bullets: string[];
  related: IntentPageLink[];
};

export const INTENT_PAGES: Record<string, IntentPageDefinition> = {
  "salaire-brut-net": {
    title: "Calcul salaire net / brut Maroc",
    kicker: "Salaire",
    description:
      "Calculez votre salaire net, votre brut, vos cotisations et obtenez une lecture simple de votre remuneration mensuelle.",
    primaryCtaLabel: "Calculer mon salaire",
    primaryCtaHref: "/salaire/brut-net",
    secondaryCtaLabel: "Voir mon IR",
    secondaryCtaHref: "/salaire/ir-igr",
    bullets: [
      "Calcul net, brut et retenues",
      "Lecture immediate des cotisations",
      "Base utile pour fiche de paie et credit",
    ],
    related: [
      { title: "SMIG / SMAG", description: "Verifiez le minimum legal applicable.", href: "/salaire/smig-smag" },
      { title: "Bulletin de paie", description: "Visualisez la paie en format exploitable.", href: "/salaire/bulletin-paie" },
      { title: "Capacite credit", description: "Estimez ce que votre salaire permet.", href: "/carriere/capacite-credit" },
    ],
  },
  "salaire-ir-igr": {
    title: "IR / IGR Maroc",
    kicker: "Salaire",
    description:
      "Comprenez votre impot sur le revenu, votre taux effectif et l'impact reel des primes ou regularisations annuelles.",
    primaryCtaLabel: "Calculer mon IR",
    primaryCtaHref: "/salaire/ir-igr",
    secondaryCtaLabel: "Voir salaire net",
    secondaryCtaHref: "/salaire/brut-net",
    bullets: [
      "Estimation annuelle de l'impot",
      "Lecture simple du taux effectif",
      "Lien direct avec brut, net et primes",
    ],
    related: [
      { title: "Prime & bonus", description: "Mesurez le net reel apres prime.", href: "/salaire/prime-bonus" },
      { title: "Avantages en nature", description: "Comprenez l'impact fiscal des avantages.", href: "/salaire/avantages-nature" },
      { title: "Bulletin de paie", description: "Visualisez vos retenues sur un bulletin.", href: "/salaire/bulletin-paie" },
    ],
  },
  "depart-licenciement": {
    title: "Licenciement au Maroc",
    kicker: "Contrat & depart",
    description:
      "Estimez vos indemnites de licenciement, votre preavis, vos conges restants et les prochaines demarches utiles.",
    primaryCtaLabel: "Calculer mes indemnites",
    primaryCtaHref: "/contrat-depart/licenciement",
    secondaryCtaLabel: "Voir le preavis",
    secondaryCtaHref: "/contrat-depart/duree-preavis",
    bullets: [
      "Indemnite legale de licenciement",
      "Preavis et conges restants",
      "Documents a preparer en sortie",
    ],
    related: [
      { title: "Lettre de preavis", description: "Generez un modele de notification.", href: "/contrat-depart/lettre-preavis" },
      { title: "Certificat de travail", description: "Preparez votre demande de certificat.", href: "/contrat-depart/certificat-travail" },
      { title: "Solde de tout compte", description: "Controlez ce qui vous est du.", href: "/outils/audit-solde-tout-compte" },
    ],
  },
  "depart-demission": {
    title: "Demission Maroc",
    kicker: "Contrat & depart",
    description:
      "Mesurez l'impact financier de votre demission, verifiez votre preavis et ouvrez les bons documents pour formaliser votre sortie.",
    primaryCtaLabel: "Simuler ma demission",
    primaryCtaHref: "/contrat-depart/demission",
    secondaryCtaLabel: "Voir le preavis",
    secondaryCtaHref: "/contrat-depart/duree-preavis",
    bullets: [
      "Impact financier de la demission",
      "Preavis avec ou sans execution",
      "Lettre et documents de sortie",
    ],
    related: [
      { title: "Lettre de demission", description: "Generez votre lettre en quelques clics.", href: "/contrat-depart/lettre-demission" },
      { title: "Lettre de preavis", description: "Ajoutez une notification formelle.", href: "/contrat-depart/lettre-preavis" },
      { title: "Certificat de travail", description: "Preparez votre demande de sortie.", href: "/contrat-depart/certificat-travail" },
    ],
  },
  "depart-preavis": {
    title: "Duree de preavis Maroc",
    kicker: "Contrat & depart",
    description:
      "Calculez la duree legale de preavis selon votre contrat, votre categorie et votre anciennete, puis passez au bon document.",
    primaryCtaLabel: "Calculer mon preavis",
    primaryCtaHref: "/contrat-depart/duree-preavis",
    secondaryCtaLabel: "Voir la lettre de preavis",
    secondaryCtaHref: "/contrat-depart/lettre-preavis",
    bullets: [
      "Preavis selon CDI, CDD ou situation de sortie",
      "Lecture simple selon anciennete",
      "Passage direct au document utile",
    ],
    related: [
      { title: "Demission", description: "Mesurez l'impact financier de votre depart.", href: "/contrat-depart/demission" },
      { title: "Licenciement", description: "Verifiez les droits en cas de rupture.", href: "/contrat-depart/licenciement" },
      { title: "Lettre de preavis", description: "Formalisez votre notification.", href: "/contrat-depart/lettre-preavis" },
    ],
  },
  "litige-salaire-impaye": {
    title: "Salaire impaye",
    kicker: "Litiges",
    description:
      "Calculez le montant du, estimez les penalites et preparez la reclamation adaptee a votre situation.",
    primaryCtaLabel: "Calculer le montant du",
    primaryCtaHref: "/litiges/salaire-impaye",
    secondaryCtaLabel: "Generer la reclamation",
    secondaryCtaHref: "/documents/salary-recovery-letter",
    bullets: [
      "Montant principal impaye",
      "Penalites et retard",
      "Lettre de reclamation et escalation",
    ],
    related: [
      { title: "Reclamation employeur", description: "Formalisez votre demande par ecrit.", href: "/litiges/reclamation-employeur" },
      { title: "Inspection du travail", description: "Passez a l'etape suivante si besoin.", href: "/litiges/inspection-travail" },
      { title: "Pre-contentieux", description: "Structurez votre dossier avant escalation.", href: "/outils/feuille-route-pre-contentieux" },
    ],
  },
  "litige-heures-sup": {
    title: "Heures supplementaires impayees",
    kicker: "Litiges",
    description:
      "Estimez les heures supplementaires non payees, les majorations applicables et la reclamation adaptee a votre dossier.",
    primaryCtaLabel: "Calculer mes heures dues",
    primaryCtaHref: "/litiges/heures-sup-impayees",
    secondaryCtaLabel: "Generer la reclamation",
    secondaryCtaHref: "/documents/overtime-claim-letter",
    bullets: [
      "Majorations legales jour, nuit et ferie",
      "Montant total reclame",
      "Passer du calcul a la lettre formelle",
    ],
    related: [
      { title: "Heures supplementaires", description: "Calculez les majorations normales.", href: "/conges-cnss/heures-supplementaires" },
      { title: "Reclamation employeur", description: "Formalisez votre demande.", href: "/litiges/reclamation-employeur" },
      { title: "Inspection du travail", description: "Escaladez si la situation bloque.", href: "/litiges/inspection-travail" },
    ],
  },
  "cnss-pension": {
    title: "Pension CNSS",
    kicker: "Congés et CNSS",
    description:
      "Projetez votre pension CNSS, vos annees cotisees et l'ecart eventuel a combler pour votre retraite.",
    primaryCtaLabel: "Projeter ma pension",
    primaryCtaHref: "/conges-cnss/pension-cnss",
    secondaryCtaLabel: "Voir retraite CNSS",
    secondaryCtaHref: "/conges-cnss/retraite-cnss",
    bullets: [
      "Projection simplifiee de pension",
      "Lien entre cotisations et revenu futur",
      "Vue utile pour anticiper votre retraite",
    ],
    related: [
      { title: "Indemnite chomage", description: "Consultez vos droits CNSS en transition.", href: "/conges-cnss/indemnite-chomage" },
      { title: "Reclamation CNSS", description: "Modele de contestation ou demande.", href: "/conges-cnss/reclamation-cnss" },
      { title: "Accident du travail", description: "Autres droits sociaux a verifier.", href: "/conges-cnss/accident-travail" },
    ],
  },
  "conge-maternite": {
    title: "Conge maternite Maroc",
    kicker: "Congés et CNSS",
    description:
      "Estimez votre revenu pendant le conge maternite, verifiez vos droits CNSS et preparez les documents utiles.",
    primaryCtaLabel: "Estimer mon conge maternite",
    primaryCtaHref: "/conges-cnss/conge-maternite",
    secondaryCtaLabel: "Generer la demande",
    secondaryCtaHref: "/documents/maternity-leave-request",
    bullets: [
      "Duree et revenu estime",
      "Prise en charge CNSS",
      "Demande officielle de conge",
    ],
    related: [
      { title: "Arret maladie", description: "Comparez avec les autres absences indemnisees.", href: "/conges-cnss/arret-maladie" },
      { title: "Conges acquis", description: "Visualisez vos autres droits de conge.", href: "/conges-cnss/conges-acquis" },
      { title: "Reclamation CNSS", description: "Preparer un dossier CNSS si besoin.", href: "/conges-cnss/reclamation-cnss" },
    ],
  },
  "heures-supplementaires": {
    title: "Heures supplementaires Maroc",
    kicker: "Congés et CNSS",
    description:
      "Calculez vos heures supplementaires, les majorations applicables et la difference entre une simple estimation et une reclamation.",
    primaryCtaLabel: "Calculer mes heures",
    primaryCtaHref: "/conges-cnss/heures-supplementaires",
    secondaryCtaLabel: "Voir les heures impayees",
    secondaryCtaHref: "/litiges/heures-sup-impayees",
    bullets: [
      "Majorations jour, nuit et ferie",
      "Calcul utile avant reclamation",
      "Lien direct vers le recouvrement si impaye",
    ],
    related: [
      { title: "Heures sup impayees", description: "Passez du calcul a la reclamation.", href: "/litiges/heures-sup-impayees" },
      { title: "Jour ferie", description: "Comparez avec le travail en jour ferie.", href: "/conges-cnss/jour-ferie" },
      { title: "Reclamation heures sup", description: "Generez votre lettre de demande.", href: "/documents/overtime-claim-letter" },
    ],
  },
  "arret-maladie": {
    title: "Arret maladie Maroc",
    kicker: "Congés et CNSS",
    description:
      "Estimez l'impact financier d'un arret maladie, la periode de carence et les demarches utiles selon votre situation.",
    primaryCtaLabel: "Simuler mon arret maladie",
    primaryCtaHref: "/conges-cnss/arret-maladie",
    secondaryCtaLabel: "Voir mes droits CNSS",
    secondaryCtaHref: "/conges-cnss/pension-cnss",
    bullets: [
      "Impact financier de l'absence",
      "Lecture simple des jours d'arret",
      "Orientation vers les droits sociaux utiles",
    ],
    related: [
      { title: "Conges acquis", description: "Visualisez vos autres droits d'absence.", href: "/conges-cnss/conges-acquis" },
      { title: "Conge maternite", description: "Consultez les autres absences indemnisees.", href: "/conges-cnss/conge-maternite" },
      { title: "Reclamation CNSS", description: "Preparez un dossier si besoin.", href: "/documents/cnss-complaint-letter" },
    ],
  },
};
