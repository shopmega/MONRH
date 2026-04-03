export type LocalizedText = {
  fr: string;
  ar: string;
};

export type CategoryHubLink = {
  title: LocalizedText;
  description: LocalizedText;
  href: string;
};

export type CategoryHub = {
  slug: string;
  title: LocalizedText;
  kicker: LocalizedText;
  description: LocalizedText;
  featuredLabel: LocalizedText;
  featuredHref: string;
  featuredDescription: LocalizedText;
  links: CategoryHubLink[];
};

export const CATEGORY_HUBS: Record<string, CategoryHub> = {
  salaire: {
    slug: "salaire",
    title: {
      fr: "Salaire, fiche de paie et retenues",
      ar: "الأجر وورقة الأداء والاقتطاعات",
    },
    kicker: {
      fr: "Salaire",
      ar: "الأجر",
    },
    description: {
      fr: "Calculez votre salaire net, verifiez vos retenues et comprenez votre fiche de paie au Maroc.",
      ar: "احسب أجرك الصافي وتحقق من الاقتطاعات وافهم ورقة الأجر الخاصة بك في المغرب.",
    },
    featuredLabel: {
      fr: "Comprendre ma fiche de paie",
      ar: "فهم ورقة أجري",
    },
    featuredHref: "/salaire/brut-net",
    featuredDescription: {
      fr: "Le point d'entree le plus simple pour verifier net, brut, IR et cotisations.",
      ar: "أسهل نقطة انطلاق للتحقق من الصافي والإجمالي والضريبة والاقتطاعات.",
    },
    links: [
      {
        title: { fr: "Calcul brut -> net", ar: "حساب الإجمالي إلى الصافي" },
        description: { fr: "Net, brut, cotisations et cout employeur.", ar: "الصافي والإجمالي والاقتطاعات وكلفة المشغل." },
        href: "/salaire/brut-net",
      },
      {
        title: { fr: "IR / IGR", ar: "الضريبة على الدخل" },
        description: { fr: "Vue annuelle de l'impot et du taux effectif.", ar: "عرض سنوي للضريبة والمعدل الفعلي." },
        href: "/salaire/ir-igr",
      },
      {
        title: { fr: "SMIG / SMAG", ar: "مطابقة SMIG / SMAG" },
        description: { fr: "Controle rapide du minimum legal.", ar: "فحص سريع للحد الادنى القانوني." },
        href: "/salaire/smig-smag",
      },
      {
        title: { fr: "Prime & bonus", ar: "المنح والمكافآت" },
        description: { fr: "Calculez le net reel apres prime.", ar: "احسب الصافي الحقيقي بعد المنحة." },
        href: "/salaire/prime-bonus",
      },
      {
        title: { fr: "Avantages en nature", ar: "المزايا العينية" },
        description: { fr: "Impact fiscal des avantages accordes.", ar: "الأثر الضريبي للمزايا الممنوحة." },
        href: "/salaire/avantages-nature",
      },
      {
        title: { fr: "Bulletin de paie", ar: "ورقة الأجر" },
        description: { fr: "Generez un bulletin detaille et conforme.", ar: "أنشئ ورقة أجر مفصلة ومطابقة." },
        href: "/salaire/bulletin-paie",
      },
    ],
  },
  "contrat-depart": {
    slug: "contrat-depart",
    title: {
      fr: "Contrat, demission et fin de travail",
      ar: "العقد والاستقالة ونهاية العمل",
    },
    kicker: {
      fr: "Contrat & depart",
      ar: "العقد والمغادرة",
    },
    description: {
      fr: "Estimez vos indemnites, votre preavis et les documents a preparer quand vous changez ou quittez un emploi.",
      ar: "قدّر تعويضاتك والإشعار والوثائق التي تحتاجها عند تغيير العمل أو مغادرته.",
    },
    featuredLabel: {
      fr: "Je quitte mon travail",
      ar: "سأغادر عملي",
    },
    featuredHref: "/contrat-depart/licenciement",
    featuredDescription: {
      fr: "Commencez par vos droits financiers, puis ouvrez la lettre adaptee a votre situation.",
      ar: "ابدأ بحقوقك المالية ثم افتح الرسالة المناسبة لوضعك.",
    },
    links: [
      {
        title: { fr: "Licenciement", ar: "الفصل" },
        description: { fr: "Indemnite, preavis, conges restants.", ar: "التعويض والإشعار والعطل المتبقية." },
        href: "/contrat-depart/licenciement",
      },
      {
        title: { fr: "Demission", ar: "الاستقالة" },
        description: { fr: "Impact financier d'une demission.", ar: "الأثر المالي للاستقالة." },
        href: "/contrat-depart/demission",
      },
      {
        title: { fr: "Duree de preavis", ar: "مدة الإشعار" },
        description: { fr: "Calculez la duree legale de preavis.", ar: "احسب مدة الإشعار القانونية." },
        href: "/contrat-depart/duree-preavis",
      },
      {
        title: { fr: "Fin de CDD", ar: "نهاية عقد CDD" },
        description: { fr: "Prime de precarite et compensation.", ar: "منحة الهشاشة والتعويض." },
        href: "/contrat-depart/fin-cdd",
      },
      {
        title: { fr: "Periode d'essai", ar: "فترة التجربة" },
        description: { fr: "Rupture et delais applicables.", ar: "الإنهاء والآجال المطبقة." },
        href: "/contrat-depart/periode-essai",
      },
      {
        title: { fr: "Lettre de demission", ar: "رسالة استقالة" },
        description: { fr: "Modele pre-rempli et imprimable.", ar: "نموذج جاهز وقابل للطباعة." },
        href: "/contrat-depart/lettre-demission",
      },
    ],
  },
  "conges-cnss": {
    slug: "conges-cnss",
    title: {
      fr: "Conges, absences et droits CNSS",
      ar: "العطل والغياب وحقوق CNSS",
    },
    kicker: {
      fr: "Congés et CNSS",
      ar: "العطل و CNSS",
    },
    description: {
      fr: "Consultez vos droits en cas de conge, maladie, maternite, accident du travail ou pension.",
      ar: "اطلع على حقوقك في حالة العطلة أو المرض أو الأمومة أو حادثة الشغل أو التقاعد.",
    },
    featuredLabel: {
      fr: "Mes droits CNSS",
      ar: "حقوقي في CNSS",
    },
    featuredHref: "/conges-cnss/pension-cnss",
    featuredDescription: {
      fr: "Accedez aux outils lies aux conges, aux indemnites et a la couverture sociale.",
      ar: "الوصول إلى أدوات العطل والتعويضات والحماية الاجتماعية.",
    },
    links: [
      {
        title: { fr: "Conges acquis", ar: "العطل المكتسبة" },
        description: { fr: "Suivez vos droits acquis et votre reliquat.", ar: "تابع حقوقك المكتسبة ورصيدك المتبقي." },
        href: "/conges-cnss/conges-acquis",
      },
      {
        title: { fr: "Heures supplementaires", ar: "الساعات الإضافية" },
        description: { fr: "Calculez les majorations legales.", ar: "احسب الزيادات القانونية." },
        href: "/conges-cnss/heures-supplementaires",
      },
      {
        title: { fr: "Arret maladie", ar: "التوقف المرضي" },
        description: { fr: "Estimez l'impact d'un arret maladie.", ar: "قدّر أثر التوقف المرضي." },
        href: "/conges-cnss/arret-maladie",
      },
      {
        title: { fr: "Conge maternite", ar: "عطلة الأمومة" },
        description: { fr: "Revenu CNSS et demarches utiles.", ar: "دخل CNSS والإجراءات المفيدة." },
        href: "/conges-cnss/conge-maternite",
      },
      {
        title: { fr: "Pension CNSS", ar: "معاش CNSS" },
        description: { fr: "Projection simplifiee de votre pension.", ar: "توقع مبسط لمعاشك." },
        href: "/conges-cnss/pension-cnss",
      },
      {
        title: { fr: "Accident du travail", ar: "حادثة شغل" },
        description: { fr: "Estimation d'indemnisation et declaration.", ar: "تقدير التعويض والتصريح." },
        href: "/conges-cnss/accident-travail",
      },
    ],
  },
  litiges: {
    slug: "litiges",
    title: {
      fr: "Litiges, reclamations et recours",
      ar: "النزاعات والمطالبات ووسائل الطعن",
    },
    kicker: {
      fr: "Litiges",
      ar: "النزاعات",
    },
    description: {
      fr: "Reagissez vite en cas de salaire impaye, heures sup non payees, harcelement ou conflit avec l'employeur.",
      ar: "تحرك بسرعة في حالة الأجر غير المؤدى أو الساعات الإضافية غير المؤداة أو التحرش أو النزاع مع المشغل.",
    },
    featuredLabel: {
      fr: "Resoudre un probleme au travail",
      ar: "حل مشكلة في العمل",
    },
    featuredHref: "/litiges/salaire-impaye",
    featuredDescription: {
      fr: "Calculez le montant du, puis ouvrez la reclamation ou la plainte adaptee.",
      ar: "احسب المبلغ المستحق ثم افتح المطالبة أو الشكاية المناسبة.",
    },
    links: [
      {
        title: { fr: "Salaire impaye", ar: "الأجر غير المؤدى" },
        description: { fr: "Estimez principal et penalites.", ar: "قدّر الأصل والغرامات." },
        href: "/litiges/salaire-impaye",
      },
      {
        title: { fr: "Heures sup impayees", ar: "الساعات الإضافية غير المؤداة" },
        description: { fr: "Recouvrez les heures dues.", ar: "استرجع الساعات المستحقة." },
        href: "/litiges/heures-sup-impayees",
      },
      {
        title: { fr: "Harcelement", ar: "التحرش" },
        description: { fr: "Evaluez votre dossier et les prochaines etapes.", ar: "قيّم ملفك والخطوات القادمة." },
        href: "/litiges/harcelement",
      },
      {
        title: { fr: "Reclamation employeur", ar: "مراسلة المشغل" },
        description: { fr: "Modele de reclamation formelle.", ar: "نموذج تظلم رسمي." },
        href: "/litiges/reclamation-employeur",
      },
      {
        title: { fr: "Inspection du travail", ar: "مفتشية الشغل" },
        description: { fr: "Preparez une plainte exploitable.", ar: "حضّر شكاية قابلة للاستعمال." },
        href: "/litiges/inspection-travail",
      },
      {
        title: { fr: "Pre-contentieux", ar: "ما قبل النزاع القضائي" },
        description: { fr: "Feuille de route avant escalation.", ar: "خريطة طريق قبل التصعيد." },
        href: "/outils/feuille-route-pre-contentieux",
      },
    ],
  },
  modeles: {
    slug: "modeles",
    title: {
      fr: "Modeles de lettres et documents",
      ar: "نماذج الرسائل والوثائق",
    },
    kicker: {
      fr: "Modeles",
      ar: "النماذج",
    },
    description: {
      fr: "Retrouvez les lettres les plus utiles pour vos demarches de travail au Maroc.",
      ar: "اعثر على أكثر الرسائل فائدة لإجراءاتك المهنية في المغرب.",
    },
    featuredLabel: {
      fr: "Tous les modeles",
      ar: "كل النماذج",
    },
    featuredHref: "/modeles",
    featuredDescription: {
      fr: "Parcourez les modeles par situation: depart, litige, conges, CNSS.",
      ar: "تصفح النماذج حسب الحالة: مغادرة، نزاع، عطل، CNSS.",
    },
    links: [
      {
        title: { fr: "Depart & demission", ar: "المغادرة والاستقالة" },
        description: { fr: "Demission, preavis, rupture amiable.", ar: "استقالة وإشعار وإنهاء ودي." },
        href: "/contrat-depart/lettre-demission",
      },
      {
        title: { fr: "Reclamations", ar: "المطالبات" },
        description: { fr: "Salaire impaye, heures sup, inspection.", ar: "أجر غير مؤدى وساعات إضافية وتفتيش." },
        href: "/litiges/reclamation-employeur",
      },
      {
        title: { fr: "Conges & absences", ar: "العطل والغياب" },
        description: { fr: "Maternite, conge sans solde, demandes RH.", ar: "أمومة وعطلة بدون أجر وطلبات إدارية." },
        href: "/conges-cnss/conge-maternite",
      },
      {
        title: { fr: "CNSS & accident", ar: "CNSS وحادثة الشغل" },
        description: { fr: "CNSS, accident du travail et protection.", ar: "CNSS وحادثة الشغل والحماية." },
        href: "/conges-cnss/reclamation-cnss",
      },
    ],
  },
  carriere: {
    slug: "carriere",
    title: {
      fr: "Carriere, freelance et decisions",
      ar: "المسار المهني والعمل الحر والقرارات",
    },
    kicker: {
      fr: "Carriere",
      ar: "المسار المهني",
    },
    description: {
      fr: "Comparez des scenarios de carriere, d'augmentation, de freelance ou de retraite.",
      ar: "قارن بين سيناريوهات المسار المهني والزيادة والعمل الحر والتقاعد.",
    },
    featuredLabel: {
      fr: "Comparer deux scenarios",
      ar: "قارن بين سيناريوهين",
    },
    featuredHref: "/carriere/comparaison-scenarios",
    featuredDescription: {
      fr: "Une zone secondaire pour les decisions de projection et d'optimisation.",
      ar: "مساحة ثانوية لقرارات التخطيط والتحسين.",
    },
    links: [
      {
        title: { fr: "Augmentation salaire", ar: "زيادة الأجر" },
        description: { fr: "Mesurez le gain net reel.", ar: "قِس المكسب الصافي الحقيقي." },
        href: "/carriere/augmentation-salaire",
      },
      {
        title: { fr: "Scenario promotion", ar: "سيناريو الترقية" },
        description: { fr: "Comparez promotion et augmentation.", ar: "قارن الترقية بالزيادة." },
        href: "/carriere/promotion",
      },
      {
        title: { fr: "Freelance vs salarie", ar: "مستقل أم أجير" },
        description: { fr: "Comparez les deux statuts.", ar: "قارن بين الوضعين." },
        href: "/carriere/freelance-vs-salarie",
      },
      {
        title: { fr: "Auto-entrepreneur", ar: "المقاول الذاتي" },
        description: { fr: "Projection du revenu net en AE.", ar: "توقع الدخل الصافي في AE." },
        href: "/carriere/auto-entrepreneur",
      },
    ],
  },
  "rh-pro": {
    slug: "rh-pro",
    title: {
      fr: "Outils RH Pro et cout employeur",
      ar: "أدوات الموارد البشرية وكلفة المشغل",
    },
    kicker: {
      fr: "RH Pro",
      ar: "موارد بشرية",
    },
    description: {
      fr: "Accedez aux outils employeur pour estimer le cout salarial, la masse salariale et les couts de recrutement.",
      ar: "استعمل أدوات المشغل لتقدير كلفة الأجور والكتلة الأجرية وتكاليف التوظيف.",
    },
    featuredLabel: {
      fr: "Voir le cout employeur",
      ar: "عرض كلفة المشغل",
    },
    featuredHref: "/rh-pro/cout-employeur-total",
    featuredDescription: {
      fr: "Un espace distinct pour les outils entreprise qui ne concernent pas directement le salarie.",
      ar: "فضاء منفصل لأدوات المؤسسة التي لا تخص الأجير بشكل مباشر.",
    },
    links: [
      {
        title: { fr: "Cout total employeur", ar: "الكلفة الإجمالية للمشغل" },
        description: { fr: "Calculez le cout complet d'un salaire pour l'entreprise.", ar: "احسب الكلفة الكاملة للأجر على المؤسسة." },
        href: "/rh-pro/cout-employeur-total",
      },
      {
        title: { fr: "Masse salariale", ar: "الكتلة الأجرية" },
        description: { fr: "Projetez le cout global d'une equipe ou d'un effectif.", ar: "توقع الكلفة الإجمالية لفريق أو عدد من الأجراء." },
        href: "/rh-pro/masse-salariale",
      },
      {
        title: { fr: "Cout de recrutement", ar: "تكلفة التوظيف" },
        description: { fr: "Estimez le cout d'une embauche sur la premiere annee.", ar: "قدر تكلفة التوظيف خلال السنة الأولى." },
        href: "/rh-pro/cout-recrutement",
      },
    ],
  },
};
