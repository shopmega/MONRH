-- Seed initial content for production bootstrap.
-- Safe to run multiple times (upsert on primary keys).

with article_seed as (
  select *
  from jsonb_to_recordset(
    $$[
      {
        "slug":"lire-fiche-paie-maroc",
        "title":"Comment lire sa fiche de paie au Maroc en 5 etapes",
        "excerpt":"Un guide simple pour verifier IR, CNSS, AMO et identifier les erreurs courantes.",
        "category_slug":"salaire",
        "reading_time":"6 min",
        "last_updated":"2026-02-12",
        "content_blocks":[
          "Commencez par comparer le salaire brut annonce dans votre contrat avec le brut mentionne sur la fiche.",
          "Verifiez ensuite les retenues sociales: CNSS, AMO, et eventuellement CIMR selon votre entreprise.",
          "Le revenu imposable ne doit pas etre confondu avec le brut. Il est calcule apres certaines deductions.",
          "Controlez l'impot retenu a la source avec les tranches applicables a la date de paie.",
          "Conservez chaque fiche et notez toute variation inattendue avant de demander une explication RH."
        ]
      },
      {
        "slug":"licenciement-montants-obligatoires",
        "title":"Licenciement: ce que l'employeur doit payer",
        "excerpt":"Indemnite legale, preavis, conges restants: check-list des montants a controler.",
        "category_slug":"licenciement",
        "reading_time":"8 min",
        "last_updated":"2026-02-12",
        "content_blocks":[
          "Les montants finaux dependent principalement de l'anciennete, du salaire de reference et de la cause de rupture.",
          "Un calcul complet inclut l'indemnite legale, l'indemnite compensatrice de preavis et les conges non pris.",
          "En cas de licenciement juge abusif, des dommages peuvent etre reclames via la procedure adequat.",
          "Chaque montant doit etre trace avec la version legale active a la date de rupture."
        ]
      },
      {
        "slug":"heures-sup-preuves-et-reclamation",
        "title":"Heures supplementaires non payees: les preuves utiles",
        "excerpt":"Quels justificatifs preparer avant une reclamation interne ou inspection du travail.",
        "category_slug":"heures-sup",
        "reading_time":"7 min",
        "last_updated":"2026-02-12",
        "content_blocks":[
          "Collectez les plannings, badges d'entree/sortie, messages de supervision et feuilles de presence.",
          "Classez les preuves par date et comparez-les avec les horaires contractuels.",
          "Avant saisine externe, adressez une demande ecrite detaillee a l'employeur.",
          "Le dossier est plus solide si les montants reclames sont calcules avec les majorations applicables."
        ]
      },
      {
        "slug":"smig-2026-verification",
        "title":"SMIG 2026: verifier si votre salaire est conforme",
        "excerpt":"Comprendre le seuil applicable et les recours en cas de non-conformite.",
        "category_slug":"salaire",
        "reading_time":"5 min",
        "last_updated":"2026-02-12",
        "content_blocks":[
          "La verification se fait sur le salaire de base et la duree de travail legale applicable.",
          "Une non-conformite repetee peut justifier une reclamation formelle avec rappel de salaire.",
          "Conservez les preuves de paie et les horaires reellement effectues pour appuyer la demande."
        ]
      },
      {
        "slug":"periode-essai-rupture-droits",
        "title":"Periode d'essai: droits en cas de rupture",
        "excerpt":"Ce que vous pouvez exiger si la rupture intervient pendant l'essai.",
        "category_slug":"contrats",
        "reading_time":"6 min",
        "last_updated":"2026-02-12",
        "content_blocks":[
          "La periode d'essai reste encadree: la rupture doit respecter les regles minimales de notification.",
          "Conservez les echanges ecrits relatifs a la rupture pour eviter les litiges ulterieurs.",
          "En cas de doute, demandez un recapitulatif ecrit de votre situation RH."
        ]
      },
      {
        "slug":"cdd-fin-contrat-checklist",
        "title":"Fin de CDD: checklist de ce qui doit etre regle",
        "excerpt":"Prime, conges, solde de tout compte: verifications prioritaires.",
        "category_slug":"contrats",
        "reading_time":"7 min",
        "last_updated":"2026-02-12",
        "content_blocks":[
          "Verifiez la date de fin officielle et les clauses de renouvellement.",
          "Controlez les droits a conges non pris et les montants correspondants.",
          "Exigez un detail complet du solde de tout compte avant signature."
        ]
      },
      {
        "slug":"conges-payes-calcul-simple",
        "title":"Conges payes: methode simple de calcul",
        "excerpt":"Comment estimer vos jours acquis et votre reliquat rapidement.",
        "category_slug":"conges",
        "reading_time":"5 min",
        "last_updated":"2026-02-12",
        "content_blocks":[
          "Calculez d'abord l'acquisition mensuelle selon la regle en vigueur.",
          "Ajoutez les reports autorises et soustrayez les jours deja consommes.",
          "Conservez un tableau mensuel pour suivre les ecarts avec les bulletins."
        ]
      },
      {
        "slug":"conge-maternite-couverture-cnss",
        "title":"Conge maternite: couverture CNSS et obligations employeur",
        "excerpt":"Duree, indemnisation et etapes administratives essentielles.",
        "category_slug":"maternite",
        "reading_time":"8 min",
        "last_updated":"2026-02-12",
        "content_blocks":[
          "Identifiez les conditions d'ouverture des droits CNSS avant depart en conge.",
          "Preparez les certificats medicaux et justificatifs dans les delais imposes.",
          "L'employeur doit respecter la protection de l'emploi pendant la periode legale."
        ]
      },
      {
        "slug":"accident-travail-demarches",
        "title":"Accident du travail: demarches a lancer sans retard",
        "excerpt":"Les declarations et preuves a reunir dans les premiers jours.",
        "category_slug":"cnss",
        "reading_time":"7 min",
        "last_updated":"2026-02-12",
        "content_blocks":[
          "Signalez l'accident immediatement et documentez le contexte precis.",
          "Conservez certificats medicaux, temoignages et preuves horaires.",
          "Suivez les formalites employeur et CNSS pour eviter un rejet de dossier."
        ]
      },
      {
        "slug":"cnss-affiliation-verification",
        "title":"CNSS: comment verifier votre affiliation",
        "excerpt":"Points de controle pour confirmer vos cotisations et droits.",
        "category_slug":"cnss",
        "reading_time":"5 min",
        "last_updated":"2026-02-12",
        "content_blocks":[
          "Comparez les cotisations prelevees sur fiche de paie avec vos releves CNSS.",
          "Signalez rapidement les periodes manquantes pour correction.",
          "Archivez vos justificatifs de salaire pour tout recours futur."
        ]
      },
      {
        "slug":"inspection-travail-plainte-structuree",
        "title":"Inspection du travail: comment structurer une plainte",
        "excerpt":"Modele de dossier pour reclamer salaires, heures sup ou abus.",
        "category_slug":"litiges",
        "reading_time":"9 min",
        "last_updated":"2026-02-12",
        "content_blocks":[
          "Commencez par un resume chronologique des faits avec dates precises.",
          "Ajoutez contrats, bulletins, preuves horaires et demandes deja adressees.",
          "Formulez une demande claire: regularisation, paiement, ou mediation."
        ]
      },
      {
        "slug":"recouvrement-salaire-impaye-plan",
        "title":"Recouvrement salaire impaye: plan d'action en 4 etapes",
        "excerpt":"Approche progressive avant d'engager un contentieux formel.",
        "category_slug":"litiges",
        "reading_time":"7 min",
        "last_updated":"2026-02-12",
        "content_blocks":[
          "Lancez une demande ecrite avec detail des mois et montants dus.",
          "Fixez un delai de reponse raisonnable et conservez la preuve d'envoi.",
          "En absence de reponse, consolidez le dossier pour inspection ou voie judiciaire."
        ]
      }
    ]$$::jsonb
  ) as t(
    slug text,
    title text,
    excerpt text,
    category_slug text,
    reading_time text,
    last_updated date,
    content_blocks jsonb
  )
)
insert into public.articles (
  slug,
  title,
  excerpt,
  category_slug,
  reading_time,
  last_updated,
  content_blocks,
  is_active,
  access
)
select
  slug,
  title,
  excerpt,
  category_slug,
  reading_time,
  last_updated,
  content_blocks,
  true,
  'public'
from article_seed
on conflict (slug) do update
set
  title = excluded.title,
  excerpt = excluded.excerpt,
  category_slug = excluded.category_slug,
  reading_time = excluded.reading_time,
  last_updated = excluded.last_updated,
  content_blocks = excluded.content_blocks,
  is_active = excluded.is_active,
  access = excluded.access,
  updated_at = now();

with template_seed as (
  select *
  from jsonb_to_recordset(
    $$[
      {
        "id":"resignation-letter",
        "title":"Lettre de Demission",
        "description":"Modele clair avec date de depart et duree de preavis.",
        "fields":[
          {"id":"employee_name","label":"Nom complet","placeholder":"Ex: Sara El Amrani"},
          {"id":"company_name","label":"Nom de l'entreprise","placeholder":"Ex: Atlas Services"},
          {"id":"position","label":"Poste","placeholder":"Ex: Chargee de paie"},
          {"id":"effective_date","label":"Date de depart","placeholder":"YYYY-MM-DD","type":"date"}
        ]
      },
      {
        "id":"notice-letter",
        "title":"Lettre de Preavis",
        "description":"Notification formelle de preavis de depart.",
        "fields":[
          {"id":"employee_name","label":"Nom complet","placeholder":"Ex: Yassine B."},
          {"id":"company_name","label":"Nom de l'entreprise","placeholder":"Ex: Orient Group"},
          {"id":"effective_date","label":"Date de fin","placeholder":"YYYY-MM-DD","type":"date"},
          {"id":"position","label":"Poste","placeholder":"Ex: Analyste"}
        ]
      },
      {
        "id":"formal-complaint-employer",
        "title":"Reclamation Formelle Employeur",
        "description":"Modele pour notifier officiellement un manquement.",
        "fields":[
          {"id":"employee_name","label":"Nom complet","placeholder":"Ex: Amal Idrissi"},
          {"id":"company_name","label":"Nom de l'entreprise","placeholder":"Ex: Ribat Logistics"},
          {"id":"issue_summary","label":"Resume du litige","placeholder":"Ex: Retard de paiement"},
          {"id":"request","label":"Demande","placeholder":"Ex: Regularisation immediate"}
        ]
      },
      {
        "id":"overtime-claim-letter",
        "title":"Demande Paiement Heures Sup",
        "description":"Lettre de demande de rappel d'heures supplementaires.",
        "fields":[
          {"id":"employee_name","label":"Nom complet","placeholder":"Ex: Karim T."},
          {"id":"company_name","label":"Nom de l'entreprise","placeholder":"Ex: Delta Support"},
          {"id":"period","label":"Periode concernee","placeholder":"Ex: Nov-Dec 2025"},
          {"id":"amount_due","label":"Montant estime (MAD)","placeholder":"Ex: 3400"}
        ]
      },
      {
        "id":"salary-recovery-letter",
        "title":"Demande de Salaire Impaye",
        "description":"Lettre de reclamation pour salaires non verses.",
        "fields":[
          {"id":"employee_name","label":"Nom complet","placeholder":"Ex: Youssef Benali"},
          {"id":"company_name","label":"Nom de l'entreprise","placeholder":"Ex: Maghreb Tech"},
          {"id":"period","label":"Periode concernee","placeholder":"Ex: Janvier 2026"},
          {"id":"amount_due","label":"Montant reclame (MAD)","placeholder":"Ex: 7500"}
        ]
      },
      {
        "id":"contract-renewal-request",
        "title":"Demande Renouvellement Contrat",
        "description":"Modele de demande de prolongation ou renouvellement CDD.",
        "fields":[
          {"id":"employee_name","label":"Nom complet","placeholder":"Ex: Nabila A."},
          {"id":"company_name","label":"Nom de l'entreprise","placeholder":"Ex: Fast Trade"},
          {"id":"position","label":"Poste","placeholder":"Ex: Assistante commerciale"},
          {"id":"request","label":"Objet de la demande","placeholder":"Ex: Renouvellement 12 mois"}
        ]
      },
      {
        "id":"employment-certificate-request",
        "title":"Demande Attestation de Travail",
        "description":"Modele pour demander une attestation professionnelle.",
        "fields":[
          {"id":"employee_name","label":"Nom complet","placeholder":"Ex: Samir E."},
          {"id":"company_name","label":"Nom de l'entreprise","placeholder":"Ex: Nova Center"},
          {"id":"position","label":"Poste","placeholder":"Ex: Superviseur"},
          {"id":"request","label":"Usage de l'attestation","placeholder":"Ex: Dossier bancaire"}
        ]
      },
      {
        "id":"cnss-complaint-letter",
        "title":"Reclamation CNSS",
        "description":"Modele de reclamation pour cotisations ou dossier CNSS.",
        "fields":[
          {"id":"employee_name","label":"Nom complet","placeholder":"Ex: Nadia H."},
          {"id":"company_name","label":"Nom de l'entreprise","placeholder":"Ex: Kappa Distribution"},
          {"id":"issue_summary","label":"Probleme constate","placeholder":"Ex: Periode non declaree"},
          {"id":"request","label":"Demande","placeholder":"Ex: Regularisation CNSS"}
        ]
      },
      {
        "id":"labor-inspector-complaint",
        "title":"Plainte a l'Inspection du Travail",
        "description":"Modele pour depose de dossier a l'inspection.",
        "fields":[
          {"id":"employee_name","label":"Nom complet","placeholder":"Ex: Amal Idrissi"},
          {"id":"company_name","label":"Nom de l'entreprise","placeholder":"Ex: Ribat Logistics"},
          {"id":"issue_summary","label":"Resume du litige","placeholder":"Ex: Heures sup non payees"},
          {"id":"request","label":"Demande","placeholder":"Ex: Paiement des rappels dus"}
        ]
      },
      {
        "id":"work-accident-declaration",
        "title":"Declaration Accident du Travail",
        "description":"Modele de declaration pour incident professionnel.",
        "fields":[
          {"id":"employee_name","label":"Nom complet","placeholder":"Ex: Mourad S."},
          {"id":"company_name","label":"Nom de l'entreprise","placeholder":"Ex: BTP Horizon"},
          {"id":"period","label":"Date/heure accident","placeholder":"Ex: 2026-01-08 09:15","type":"datetime-local"},
          {"id":"issue_summary","label":"Description","placeholder":"Ex: Chute en poste de travail"}
        ]
      },
      {
        "id":"maternity-leave-request",
        "title":"Demande Conge Maternite",
        "description":"Demande formelle de conge maternite.",
        "fields":[
          {"id":"employee_name","label":"Nom complet","placeholder":"Ex: Salma K."},
          {"id":"company_name","label":"Nom de l'entreprise","placeholder":"Ex: Med Office"},
          {"id":"effective_date","label":"Date de debut","placeholder":"YYYY-MM-DD","type":"date"},
          {"id":"request","label":"Details","placeholder":"Ex: Conge legal + pieces jointes"}
        ]
      },
      {
        "id":"unpaid-leave-request",
        "title":"Demande Conge Sans Solde",
        "description":"Modele de demande de conge exceptionnel non remunere.",
        "fields":[
          {"id":"employee_name","label":"Nom complet","placeholder":"Ex: Othman L."},
          {"id":"company_name","label":"Nom de l'entreprise","placeholder":"Ex: Atlas Port"},
          {"id":"period","label":"Periode demandee","placeholder":"Ex: 01/03 au 15/03"},
          {"id":"request","label":"Motif","placeholder":"Ex: Contraintes familiales"}
        ]
      },
      {
        "id":"harassment-report-letter",
        "title":"Signalement Harcelement",
        "description":"Lettre de signalement interne d'agissements inappropries.",
        "fields":[
          {"id":"employee_name","label":"Nom complet","placeholder":"Ex: Rania M."},
          {"id":"company_name","label":"Nom de l'entreprise","placeholder":"Ex: Prime Call"},
          {"id":"period","label":"Periode des faits","placeholder":"Ex: Dec 2025 - Jan 2026"},
          {"id":"issue_summary","label":"Faits resumes","placeholder":"Ex: Propos repetes et menaces"}
        ]
      },
      {
        "id":"mutual-termination-proposal",
        "title":"Proposition Rupture Amiable",
        "description":"Proposition de rupture d'un commun accord.",
        "fields":[
          {"id":"employee_name","label":"Nom complet","placeholder":"Ex: Ismail T."},
          {"id":"company_name","label":"Nom de l'entreprise","placeholder":"Ex: Nova Light"},
          {"id":"effective_date","label":"Date proposee","placeholder":"YYYY-MM-DD","type":"date"},
          {"id":"request","label":"Conditions proposees","placeholder":"Ex: Reglement soldes et documents"}
        ]
      }
    ]$$::jsonb
  ) as t(
    id text,
    title text,
    description text,
    fields jsonb
  )
)
insert into public.document_templates (
  id,
  title,
  description,
  fields,
  is_active
)
select
  id,
  title,
  description,
  fields,
  true
from template_seed
on conflict (id) do update
set
  title = excluded.title,
  description = excluded.description,
  fields = excluded.fields,
  is_active = excluded.is_active,
  updated_at = now();

