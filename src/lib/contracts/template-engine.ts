// Template Engine - Variable Injection System (No AI, Deterministic)

import type { ContractTemplate, ContractFormData, ContractClause, ContractPreview } from './types';
import { ContractConditionEvaluator } from './condition-evaluator';

export class ContractTemplateEngine {
  private template: ContractTemplate;
  private clauses: ContractClause[];

  constructor(template: ContractTemplate, clauses: ContractClause[]) {
    this.template = template;
    this.clauses = clauses.filter(clause => clause.is_active);
  }

  // Generate contract preview with variable injection
  generatePreview(formData: ContractFormData, requiredFields?: string[]): ContractPreview {
    const sections = this.template.sections
      .sort((a, b) => a.order - b.order)
      .filter(section => this.shouldIncludeSection(section, formData))
      .map(section => ({
        id: section.id,
        title: section.title,
        content: this.injectVariables(section.content, formData)
      }));

    const variables = this.extractVariables(formData);
    const is_complete = this.isComplete(formData, requiredFields);
    const completion_percentage = this.calculateCompletion(formData, requiredFields);

    return {
      sections,
      variables,
      is_complete,
      completion_percentage
    };
  }

  // Generate final contract content with professional formatting
  generateContract(formData: ContractFormData): string {
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
    return ContractConditionEvaluator.evaluate(section.condition_expression, formData);
  }

  // Generate article-based structure
  private generateArticles(formData: ContractFormData): string {
    const articles: string[] = [];
    let articleNum = 1;

    // Filter and sort sections to be rendered as articles
    const activeSections = this.template.sections
      .sort((a, b) => a.order - b.order)
      .filter(section => this.shouldIncludeSection(section, formData));

    activeSections.forEach(section => {
      const content = this.injectVariables(section.content, formData);
      articles.push(`
ARTICLE ${articleNum} : ${section.title.toUpperCase()}
${this.getArticleSeparator(articleNum)}

${content}
      `);
      articleNum++;
    });

    // Append Clauses as additional articles if they weren't part of template sections
    const clausesSection = this.formatClausesAsArticles(formData, articleNum);
    if (clausesSection.content) {
      articles.push(clausesSection.content);
      articleNum = clausesSection.nextArticleNum;
    }

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
    if (result.includes('{{selected_clauses}}')) {
      result = this.injectClauses(result, formData);
    }

    return result;
  }

  // Get value for a variable
  private getVariableValue(variableName: string, formData: ContractFormData): string {
    const value = ContractConditionEvaluator.getFieldValue(formData, variableName);
    
    if (value === null || value === undefined) {
      return '';
    }
    
    // Format salary
    if (variableName.includes('salary') && typeof value === 'number') {
      return value.toLocaleString('fr-MA').replace(/\s/g, ' ');
    }

    // Format dates
    if (variableName.includes('_date') && typeof value === 'string' && value.includes('-')) {
      return this.formatDate(value);
    }

    return String(value);
  }

  // Inject selected clauses into a placeholder
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
    
    return content.replace('{{selected_clauses}}', clausesText);
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
  private isComplete(formData: ContractFormData, requiredFieldsFromRules?: string[]): boolean {
    const requiredFields = requiredFieldsFromRules || [
      'employee_name',
      'company_name', 
      'job_title',
      'start_date',
      'salary_brut'
    ];

    return requiredFields.every(field => {
      const value = ContractConditionEvaluator.getFieldValue(formData, field);
      return value !== null && value !== undefined && String(value).trim() !== '';
    });
  }

  // Calculate completion percentage
  private calculateCompletion(formData: ContractFormData, requiredFieldsFromRules?: string[]): number {
    const allFields = requiredFieldsFromRules || [
      'employee_name',
      'company_name',
      'job_title',
      'start_date',
      'salary_brut',
      'contract_location',
      'employee_cin'
    ];
    
    if (allFields.length === 0) return 100;

    const filledFields = allFields.filter(field => {
      const value = ContractConditionEvaluator.getFieldValue(formData, field);
      return value !== null && value !== undefined && String(value).trim() !== '';
    });

    return Math.round((filledFields.length / allFields.length) * 100);
  }
}
