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

  // Generate final contract content
  generateContract(formData: ContractFormData): string {
    const sections = this.template.sections
      .sort((a, b) => a.order - b.order)
      .map(section => {
        const content = this.injectVariables(section.content, formData);
        return `${section.title}\n${content}\n`;
      });

    return sections.join('\n');
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
    
    let clausesText = '';
    
    for (const clauseId of formData.selected_clauses) {
      const clause = this.clauses.find(c => c.id === clauseId);
      if (clause) {
        let clauseContent = clause.content;
        
        // Inject clause-specific variables
        if (formData.clause_variables && formData.clause_variables[clauseId]) {
          const variables = formData.clause_variables[clauseId] as unknown as Record<string, string>;
          Object.keys(variables).forEach(variable => {
            clauseContent = clauseContent.replace(
              new RegExp(`{{${variable}}}`, 'g'), 
              variables[variable]
            );
          });
        }
        
        clausesText += `\n${clause.title}\n${clauseContent}\n`;
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
