-- SQL Seed for new Document Templates in /planifier section
-- run this in your Supabase SQL Editor

INSERT INTO document_templates (id, title, description, is_active, fields)
VALUES
  (
    'salary-negotiation-letter',
    'Lettre de Negociation Salariale',
    'Demande de revalorisation basee sur la performance et le marche.',
    true,
    '[{"id": "employee_name", "label": "Nom Complet", "type": "text"}, {"id": "company_name", "label": "Entreprise", "type": "text"}, {"id": "position", "label": "Poste Actuel", "type": "text"}, {"id": "city", "label": "Ville", "type": "text"}]'
  ),
  (
    'promotion-request-email',
    'Email de Demande de Promotion',
    'Formuler une candidature interne pour un poste superieur.',
    true,
    '[{"id": "employee_name", "label": "Nom Complet", "type": "text"}, {"id": "company_name", "label": "Entreprise", "type": "text"}, {"id": "position", "label": "Poste Souhaite", "type": "text"}]'
  ),
  (
    'compensation-comparison-report',
    'Rapport de Comparaison de Compensation',
    'Synthese des scenarios (Salaire vs Bonus vs Avantages).',
    true,
    '[{"id": "employee_name", "label": "Nom Complet", "type": "text"}, {"id": "company_name", "label": "Entreprise", "type": "text"}]'
  ),
  (
    'bonus-request-letter',
    'Demande de Prime Exceptionnelle',
    'Reclamation d''un bonus suite a une reussite projet.',
    true,
    '[{"id": "employee_name", "label": "Nom Complet", "type": "text"}, {"id": "company_name", "label": "Entreprise", "type": "text"}, {"id": "issue_summary", "label": "Projet / Motif", "type": "text"}]'
  ),
  (
    'variable-compensation-breakdown',
    'Detail du Variable (Bonus)',
    'Justificatif de calcul de la part variable.',
    true,
    '[{"id": "employee_name", "label": "Nom Complet", "type": "text"}, {"id": "period", "label": "Periode", "type": "text"}]'
  ),
  (
    'freelance-pricing-sheet',
    'Grille de Tarification Freelance',
    'Positionnement TJM et offre de services AE.',
    true,
    '[{"id": "employee_name", "label": "Nom Freelance", "type": "text"}, {"id": "city", "label": "Ville", "type": "text"}]'
  ),
  (
    'invoice-template',
    'Modele de Facture AE',
    'Format conforme pour les auto-entrepreneurs.',
    true,
    '[{"id": "employee_name", "label": "Nom / Raison Sociale", "type": "text"}, {"id": "company_name", "label": "Client", "type": "text"}, {"id": "amount_due", "label": "Montant HT (MAD)", "type": "text"}]'
  )
ON CONFLICT (id) DO UPDATE 
SET title = EXCLUDED.title, description = EXCLUDED.description, fields = EXCLUDED.fields, is_active = EXCLUDED.is_active;
