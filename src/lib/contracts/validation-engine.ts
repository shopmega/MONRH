// Rule-based Validation Engine - No AI, Deterministic

import type { ContractFormData, ValidationRule, ValidationResult, ValidationError, ValidationWarning, DefaultValue } from './types';
import { ContractConditionEvaluator } from './condition-evaluator';

export class ContractValidationEngine {
  private rules: ValidationRule[] = [];

  constructor(rules: ValidationRule[]) {
    this.rules = rules.filter(rule => rule.is_active);
  }

  validate(formData: ContractFormData, contractType: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const defaults: DefaultValue[] = [];

    // Get relevant rules for this contract type and sort by priority
    const relevantRules = this.rules.filter(rule => 
      rule.contract_type === contractType || rule.contract_type === 'ALL'
    ).sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (const rule of relevantRules) {
      try {
        const result = this.evaluateRule(rule, formData);
        
        if (result) {
          if (rule.rule_type === 'required') {
            errors.push(result as ValidationError);
          } else if (rule.rule_type === 'warning') {
            warnings.push(result as ValidationWarning);
          } else if (rule.rule_type === 'default') {
            defaults.push(result as DefaultValue);
          }
        }
      } catch (error) {
        console.warn(`Validation rule ${rule.id} failed:`, error);
      }
    }

    const isValid = errors.length === 0;

    return {
      isValid,
      errors,
      warnings,
      defaults
    };
  }

  private evaluateRule(rule: ValidationRule, formData: ContractFormData): ValidationError | ValidationWarning | DefaultValue | null {
    const fieldValue = this.getFieldValue(formData, rule.field_path);

    switch (rule.rule_type) {
      case 'required':
        if (!this.isRequiredSatisfied(fieldValue, rule.condition_expression, formData)) {
          return {
            field: rule.field_path,
            message: rule.error_message || `Field ${rule.field_path} is required`,
            rule_id: rule.id
          } as ValidationError;
        }
        break;

      case 'warning':
        if (rule.condition_expression && this.evaluateCondition(rule.condition_expression, formData)) {
          return {
            field: rule.field_path,
            message: rule.error_message || `Warning for ${rule.field_path}`,
            rule_id: rule.id
          } as ValidationWarning;
        }
        break;

      case 'default':
        if (rule.condition_expression && rule.value_expression && this.evaluateCondition(rule.condition_expression, formData)) {
          const defaultValue = this.evaluateDefault(rule.value_expression, formData);
          return {
            field: rule.field_path,
            value: defaultValue,
            rule_id: rule.id
          } as DefaultValue;
        }
        break;
    }

    return null;
  }

  private getFieldValue(formData: ContractFormData, path: string): any {
    return ContractConditionEvaluator.getFieldValue(formData, path);
  }

  private isRequiredSatisfied(fieldValue: any, condition?: string, formData?: ContractFormData): boolean {
    if (!condition) {
      // Simple required check
      return fieldValue !== null && fieldValue !== undefined && String(fieldValue).trim() !== '';
    }

    // Use the shared evaluator
    return ContractConditionEvaluator.evaluate(condition, formData || ({} as any));
  }

  /**
   * Evaluates a DSL expression against form data.
   * Delegated to the shared ContractConditionEvaluator.
   */
  private evaluateCondition(expression: string | null | undefined, formData: ContractFormData): boolean {
    return ContractConditionEvaluator.evaluate(expression, formData);
  }

  private evaluateDefault(expression: string, formData: ContractFormData): string {
    if (!expression) return '';

    try {
      // Handle simple default values
      if (expression.startsWith("'") && expression.endsWith("'")) {
        return expression.slice(1, -1); // Remove quotes
      }
      if (expression.startsWith('"') && expression.endsWith('"')) {
        return expression.slice(1, -1); // Remove quotes
      }
      
      if (expression === 'CURRENT_DATE') {
        return new Date().toISOString().split('T')[0];
      }
      
      if (!isNaN(Number(expression))) {
        return expression;
      }

      return expression;
    } catch (error) {
      console.warn('Default value evaluation failed:', expression, error);
      return '';
    }
  }

  // Apply default values to form data
  applyDefaults(formData: ContractFormData, defaults: DefaultValue[]): ContractFormData {
    const updatedData = { ...formData };

    defaults.forEach(defaultValue => {
      // Only apply if field is empty
      const currentValue = this.getFieldValue(updatedData, defaultValue.field);
      if (currentValue === null || currentValue === undefined || String(currentValue).trim() === '') {
        (updatedData as any)[defaultValue.field] = defaultValue.value;
      }
    });

    return updatedData;
  }

  // Get validation messages for a specific field
  getFieldValidation(field: string, formData: ContractFormData, contractType: string): {
    error?: string;
    warning?: string;
  } {
    const result = this.validate(formData, contractType);
    
    const error = result.errors.find(e => e.field === field);
    const warning = result.warnings.find(w => w.field === field);

    return {
      error: error?.message,
      warning: warning?.message
    };
  }
}
