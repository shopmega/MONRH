// Template Engine - Variable Injection System (No AI, Deterministic)

import type { ContractTemplate, ContractFormData, ContractClause, ContractPreview } from './types';

export class ContractTemplateEngine {
  private template: ContractTemplate;
  private clauses: ContractClause[];

  constructor(template: ContractTemplate, clauses: ContractClause[]) {
    this.template = template;
    this.clauses = clauses.filter(clause => clause.is_active);
  }

  // Generate contract preview with variable injection
  generatePreview(formData: ContractFormData): ContractPreview {
    const sections = this.template.sections
      .sort((a, b) => a.order - b.order)
      .filter(section => this.shouldIncludeSection(section, formData))
      .map(section => ({
        id: section.id,
        title: section.title,
        content: this.injectVariables(section.content, formData)
      }));

    const variables = this.extractVariables(formData);
    const is_complete = this.isComplete(formData);
    const completion_percentage = this.calculateCompletion(formData);

    return {
      sections,
      variables,
      is_complete,
      completion_percentage
    };
  }

  // Generate final contract content with professional formatting
  generateContract(formData: ContractFormData): string {
    const contractType = formData.contract_type === 'CDI' 
      ? 'CONTRAT DE TRAVAIL À DURÉE INDÉTERMINÉE (CDI)'
      : 'CONTRAT DE TRAVAIL À DURÉE DÉTERMINÉE (CDD)';

    // Parties section
    const parties = `
ENTRE LES SOUSSIGNÉS :

1. L'EMPLOYEUR :
   Nom : ${formData.company_name}
   Adresse : ${formData.company_address}
   Registre du Commerce : ${formData.company_rc}
   CNSS : ${formData.company_cnss}

2. LE SALARIÉ :
   Nom : ${formData.employee_name}
   CIN : ${formData.employee_cin}
   Adresse : ${formData.employee_address}
   ${formData.employee_cnss ? `CNSS : ${formData.employee_cnss}` : ''}

─────────────────────────────────────────────────────────────────────────────────

IL A ÉTÉ CONVENU CE QUI SUIT :
`;

    // Generate articles from template sections
    const articles = this.generateArticles(formData);

    // Footer
    const footer = `
─────────────────────────────────────────────────────────────────────────────────

FAIT À ${formData.contract_location?.toUpperCase() || 'CASABLANCA'}, LE ${this.formatDate(formData.contract_date)}

PARTIES :

Pour l'Employeur :                    Pour le Salarié :
Signature : _______________          Signature : _______________
Nom/Fonction : _______________      Nom : _______________

Date : _______________              Date : _______________


─────────────────────────────────────────────────────────────────────────────────
Conformément au Code du Travail Marocain (Loi 65-99)
Juridiction compétente : Tribunaux de ${formData.contract_location?.toUpperCase() || 'CASABLANCA'}

Document généré par MONRH - Plateforme de Droit du Travail au Maroc
Date de génération : ${new Date().toLocaleDateString('fr-MA')}
─────────────────────────────────────────────────────────────────────────────────
`;

    return parties + articles + footer;
  }

  // Check if a section should be included based on condition
  private shouldIncludeSection(section: any, formData: ContractFormData): boolean {
    if (!section.condition_expression) {
      return true; // No condition means always include
    }

    // Reuse validation engine logic for consistency
    // For now, implement simple evaluation here
    try {
      const expr = section.condition_expression;
      
      // Handle basic conditions
      if (expr.includes(' CONTAINS ')) {
        const match = expr.match(/([\w\.]+)\s+CONTAINS\s+"([^"]+)"/);
        if (match) {
          const fieldName = match[1];
          const expected = match[2];
          const fieldValue = (formData as any)[fieldName];
          if (Array.isArray(fieldValue)) {
            return fieldValue.includes(expected);
          }
          return String(fieldValue) === expected;
        }
      }

      if (expr.includes(' == ') || expr.includes(' = ')) {
        const match = expr.match(/([\w\.]+)\s*==?\s*["']?([^"']+)["']?$/);
        if (match) {
          const fieldName = match[1];
          const expected = match[2];
          const fieldValue = (formData as any)[fieldName];
          return String(fieldValue) === expected;
        }
      }

      if (expr.includes(' IS NOT NULL') || expr.includes(' IS SET')) {
        const match = expr.match(/([\w\.]+)\s+IS\s+(?:NOT\s+NULL|SET)/);
        if (match) {
          const fieldName = match[1];
          const fieldValue = (formData as any)[fieldName];
          return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
        }
      }

      return true; // Default to include if condition can't be evaluated
    } catch (error) {
      console.warn('Section condition evaluation failed:', error);
      return true; // Default to include on error
    }
  }

  // Generate article-based structure
  private generateArticles(formData: ContractFormData): string {
    const articles: string[] = [];
    let articleNum = 1;

    // Article 1: Objet du contrat
    articles.push(`
ARTICLE ${articleNum} : OBJET DU CONTRAT
${this.getArticleSeparator(articleNum)}

Le salarié est engagé en qualité de ${formData.job_title} chez l'employeur.
Cet engagement est conclu pour une durée ${formData.contract_type === 'CDI' ? 'indéterminée' : 'déterminée'}.
    `);
    articleNum++;

    // Article 2: Fonction & Lieu de travail
    articles.push(`
ARTICLE ${articleNum} : FONCTION ET LIEU DE TRAVAIL
${this.getArticleSeparator(articleNum)}

Fonction : ${formData.job_title}

Description des fonctions :
${formData.job_description}

Niveau hiérarchique : ${formData.role_level === 'cadre' ? 'Cadre' : 'Employé'}

Lieu de travail : ${formData.contract_location}
    `);
    articleNum++;

    // Article 3: Durée du contrat
    if (formData.contract_type === 'CDI') {
      articles.push(`
ARTICLE ${articleNum} : DURÉE DU CONTRAT
${this.getArticleSeparator(articleNum)}

Le présent contrat est conclu pour une durée indéterminée.
Date de début : ${this.formatDate(formData.start_date)}
      `);
    } else {
      articles.push(`
ARTICLE ${articleNum} : DURÉE DU CONTRAT
${this.getArticleSeparator(articleNum)}

Le présent contrat est conclu pour une durée déterminée.
Date de début : ${this.formatDate(formData.start_date)}
Date de fin : ${this.formatDate(formData.end_date || '')}
Durée : ${formData.contract_duration} mois
Motif du CDD : ${formData.cdd_justification}
      `);
    }
    articleNum++;

    // Article 4: Période d'essai
    articles.push(`
ARTICLE ${articleNum} : PÉRIODE D'ESSAI
${this.getArticleSeparator(articleNum)}

Une période d'essai de ${formData.trial_period_duration} est prévue.
Au cours de cette période, l'une ou l'autre des parties pourra résilier le contrat sans indemnité, 
moyennant un préavis de 8 jours.
    `);
    articleNum++;

    // Article 5: Rémunération
    articles.push(`
ARTICLE ${articleNum} : RÉMUNÉRATION
${this.getArticleSeparator(articleNum)}

Le salarié percevra une rémunération mensuelle brute de ${formData.salary_brut.toLocaleString('fr-MA')} MAD.
${formData.salary_net ? `Salaire net estimé : ${formData.salary_net.toLocaleString('fr-MA')} MAD` : ''}

Fréquence de paiement : ${formData.payment_frequency}
Mode de paiement : ${formData.payment_method}

Le salarié cotise aux régimes de retraite et d'assurance en vigueur au sein de l'entreprise.
    `);
    articleNum++;

    // Article 6: Horaires de travail
    articles.push(`
ARTICLE ${articleNum} : HORAIRES ET CONDITIONS DE TRAVAIL
${this.getArticleSeparator(articleNum)}

Horaires : ${formData.work_schedule}
Heures de travail par semaine : ${formData.work_hours}
Jours de travail : ${formData.work_days}

Congés annuels : ${formData.annual_leave_days} jours ouvrables

Le salarié bénéficiera également des jours fériés et congés exceptionnels prévus par le Code du Travail.
    `);
    articleNum++;

    // Articles: Clauses particulières
    const clausesSection = this.formatClausesAsArticles(formData, articleNum);
    if (clausesSection.content) {
      articles.push(clausesSection.content);
      articleNum = clausesSection.nextArticleNum;
    }

    // Article: Résiliation
    articles.push(`
ARTICLE ${articleNum} : RÉSILIATION ET RUPTURE
${this.getArticleSeparator(articleNum)}

Le présent contrat peut prendre fin :
- Par consentement mutuel
- Par démission avec préavis de ${formData.notice_period_employee} jours
- Par licenciement conformément au Code du Travail Marocain
- Pour faute grave sans indemnité
- Pour inaptitude ou impossibilité d'exécution du contrat

Toute rupture abusive peut donner lieu à dommages et intérêts.
    `);
    articleNum++;

    // Article: Droit applicable
    articles.push(`
ARTICLE ${articleNum} : DROIT APPLICABLE ET JURIDICTION
${this.getArticleSeparator(articleNum)}

Le présent contrat est régi par les dispositions du Code du Travail Marocain (Loi 65-99 modifiée).

Toute contestation relative à l'exécution ou l'interprétation du présent contrat sera soumise 
à la compétence exclusive des tribunaux du siège social de l'entreprise.
    `);

    return articles.join('\n');
  }

  // Format clauses as additional articles
  private formatClausesAsArticles(formData: ContractFormData, startArticleNum: number): { content: string; nextArticleNum: number } {
    if (!formData.selected_clauses || formData.selected_clauses.length === 0) {
      return { content: '', nextArticleNum: startArticleNum };
    }

    const clauseUnits: Record<string, string> = {
      mobility_notice: 'jours',
      non_competition_duration: 'mois',
      non_competition_radius: 'km',
      non_competition_compensation: 'MAD',
      probation_extension_duration: 'jours',
      remote_work_days: 'jours/semaine'
    };

    const articles: string[] = [];
    let articleNum = startArticleNum;

    for (const clauseId of formData.selected_clauses) {
      const clause = this.clauses.find(c => c.id === clauseId);
      if (clause) {
        let clauseContent = clause.content;

        // Inject clause-specific variables with units
        if (formData.clause_variables && formData.clause_variables[clauseId]) {
          const variables = formData.clause_variables[clauseId] as unknown as Record<string, string>;
          Object.keys(variables).forEach(variable => {
            const value = variables[variable];
            const unit = clauseUnits[variable];
            const formattedValue = unit ? `${value} ${unit}` : value;
            clauseContent = clauseContent.replace(
              new RegExp(`{{${variable}}}`, 'g'), 
              formattedValue
            );
          });
        }

        articles.push(`
ARTICLE ${articleNum} : ${clause.title.toUpperCase()}
${this.getArticleSeparator(articleNum)}

${clauseContent}
        `);
        articleNum++;
      }
    }

    return { content: articles.join('\n'), nextArticleNum: articleNum };
  }

  private getArticleSeparator(num: number): string {
    return '─'.repeat(80);
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return 'XX/XX/XXXX';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-MA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }

  // Inject variables into template content
  private injectVariables(content: string, formData: ContractFormData): string {
    let result = content;

    // Replace all {{variables}} with actual values
    const variablePattern = /\{\{(\w+)\}\}/g;
    
    result = result.replace(variablePattern, (match, variableName) => {
      const value = this.getVariableValue(variableName, formData);
      return value !== '' ? value : `[${variableName}]`;
    });

    // Handle clause injection
    result = this.injectClauses(result, formData);

    return result;
  }

  // Get value for a variable
  private getVariableValue(variableName: string, formData: ContractFormData): string {
    const value = formData[variableName as keyof ContractFormData];
    
    if (value === null || value === undefined) {
      return '';
    }
    
    // Format salary with Moroccan formatting (space instead of dot)
    if (variableName.includes('salary') && typeof value === 'number') {
      return value.toLocaleString('fr-MA').replace(/\s/g, ' ');
    }

    // Format dates
    if (variableName.includes('date') && typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('fr-MA', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
    }
    if (variableName.includes('salary') && typeof value === 'number') {
      return value.toLocaleString('fr-MA');
    }

    return String(value);
  }

  // Inject selected clauses
  private injectClauses(content: string, formData: ContractFormData): string {
    if (!formData.selected_clauses || formData.selected_clauses.length === 0) {
      return content.replace('{{selected_clauses}}', 'Aucune clause particulière sélectionnée.');
    }
    
    const clauseUnits: Record<string, string> = {
      mobility_notice: 'jours',
      non_competition_duration: 'mois',
      non_competition_radius: 'km',
      non_competition_compensation: 'MAD',
      probation_extension_duration: 'jours',
      remote_work_days: 'jours/semaine'
    };

    let clausesText = '';
    
    for (const clauseId of formData.selected_clauses) {
      const clause = this.clauses.find(c => c.id === clauseId);
      if (clause) {
        let clauseContent = clause.content;
        
        // Inject clause-specific variables with units
        if (formData.clause_variables && formData.clause_variables[clauseId]) {
          const variables = formData.clause_variables[clauseId] as unknown as Record<string, string>;
          Object.keys(variables).forEach(variable => {
            const value = variables[variable];
            const unit = clauseUnits[variable];
            const formattedValue = unit ? `${value} ${unit}` : value;
            clauseContent = clauseContent.replace(
              new RegExp(`{{${variable}}}`, 'g'), 
              formattedValue
            );
          });
        }
        
        clausesText += `\n• ${clause.title}\n${clauseContent}\n`;
      }
    }
    
    return content.replace('{{selected_clauses}}', clausesText || 'Aucune clause particulière sélectionnée.');
  }

  // Extract all variables from form data
  private extractVariables(formData: ContractFormData): Record<string, string> {
    const variables: Record<string, string> = {};

    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'selected_clauses' && key !== 'clause_variables') {
        variables[key] = this.getVariableValue(key, formData);
      }
    });

    return variables;
  }

  // Check if contract is complete (all required fields filled)
  private isComplete(formData: ContractFormData): boolean {
    const requiredFields = [
      'employee_name',
      'company_name', 
      'job_title',
      'start_date',
      'salary_brut'
    ];

    // Add CDD specific requirements
    if (formData.contract_type === 'CDD') {
      requiredFields.push('end_date', 'cdd_justification');
    }

    return requiredFields.every(field => {
      const value = formData[field as keyof ContractFormData];
      return value !== null && value !== undefined && value !== '';
    });
  }

  // Calculate completion percentage
  private calculateCompletion(formData: ContractFormData): number {
    const allFields = Object.keys(formData).filter(key => 
      key !== 'selected_clauses' && key !== 'clause_variables'
    );
    
    const filledFields = allFields.filter(field => {
      const value = formData[field as keyof ContractFormData];
      return value !== null && value !== undefined && value !== '';
    });

    return Math.round((filledFields.length / allFields.length) * 100);
  }

  // Get list of missing variables
  getMissingVariables(formData: ContractFormData): string[] {
    const content = this.template.sections.map(s => s.content).join('\n');
    const variablePattern = /\{\{(\w+)\}\}/g;
    const requiredVariables = new Set<string>();
    
    let match;
    while ((match = variablePattern.exec(content)) !== null) {
      requiredVariables.add(match[1]);
    }

    return Array.from(requiredVariables).filter(variable => {
      const value = formData[variable as keyof ContractFormData];
      return value === null || value === undefined || value === '';
    });
  }

  // Get clause variables for a specific clause
  getClauseVariables(clauseId: string): string[] {
    const clause = this.clauses.find(c => c.id === clauseId);
    if (!clause) return [];

    const variablePattern = /\{\{(\w+)\}\}/g;
    const variables = new Set<string>();
    
    let match;
    while ((match = variablePattern.exec(clause.content)) !== null) {
      variables.add(match[1]);
    }

    return Array.from(variables);
  }

  // Validate template structure
  validateTemplate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if template has required sections
    const requiredSections = ['parties', 'job', 'salary', 'signature'];
    const sectionIds = this.template.sections.map(s => s.id);

    requiredSections.forEach(requiredSection => {
      if (!sectionIds.includes(requiredSection)) {
        errors.push(`Template missing required section: ${requiredSection}`);
      }
    });

    // Check for invalid variable patterns
    this.template.sections.forEach(section => {
      const invalidPatterns = section.content.match(/\{[^{]|[^}]\}/g);
      if (invalidPatterns) {
        errors.push(`Invalid variable patterns in section ${section.id}: ${invalidPatterns.join(', ')}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
