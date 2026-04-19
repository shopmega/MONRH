// Rule-based Validation Engine - No AI, Deterministic

import type { ContractFormData, ValidationRule, ValidationResult, ValidationError, ValidationWarning, DefaultValue } from './types';

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

  private getFieldValue(formData: ContractFormData, fieldPath: string): string | number | boolean | undefined {
    // Support nested paths like "clause_variables.non_competition_duration" or "selected_clauses"
    if (!fieldPath) return undefined;

    const pathParts = fieldPath.split('.');

    let current: ContractFormData | string | number | boolean | Record<string, string> = formData;
    for (const part of pathParts) {
      if (current === null || current === undefined) return undefined;
      if (typeof current === 'object' && !Array.isArray(current)) {
        current = (current as Record<string, unknown>)[part] as string | number | boolean | Record<string, string>;
      } else {
        // Handle the case where current is a primitive value
        return undefined;
      }
    }

    // Final return should be the actual value, not an object
    if (typeof current === 'object' && !Array.isArray(current)) {
      return undefined;
    }

    return current as string | number | boolean;
  }

  private isRequiredSatisfied(fieldValue: string | number | boolean | undefined, condition?: string, formData?: ContractFormData): boolean {
    if (!condition) {
      // Simple required check
      return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
    }

    // Handle SQL-style conditions
    if (condition.includes('IS NOT NULL') && condition.includes('!= ""')) {
      // Pattern: "field_name IS NOT NULL AND field_name != """
      return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
    }

    if (condition.includes(' CONTAINS ')) {
      if (!formData) {
        return false;
      }
      const match = condition.match(/(\w+)\s+CONTAINS\s+"([^"]+)"/);
      if (match) {
        const fieldName = match[1];
        const expected = match[2];
        const fieldValue = this.getFieldValue(formData, fieldName);
        if (Array.isArray(fieldValue)) {
          return fieldValue.includes(expected);
        }
        if (typeof fieldValue === 'string') {
          return fieldValue === expected;
        }
        return false;
      }
    }

    if (condition.includes('>')) {
      if (!formData) {
        return false;
      }
      // Pattern: "field_name > value"
      const match = condition.match(/([\w\.]+)\s*>\s*([\d\.]+)/);
      if (match) {
        const fieldName = match[1];
        const threshold = parseFloat(match[2]);
        const fieldValueFromData = this.getFieldValue(formData, fieldName);
        const actualValue = typeof fieldValueFromData === 'number' ? fieldValueFromData : parseFloat(String(fieldValueFromData));
        return !isNaN(actualValue) && actualValue > threshold;
      }
    }

    if (condition.includes('<')) {
      if (!formData) {
        return false;
      }
      // Pattern: "field_name < value"
      const match = condition.match(/([\w\.]+)\s*<\s*([\d\.]+)/);
      if (match) {
        const fieldName = match[1];
        const threshold = parseFloat(match[2]);
        const fieldValueFromData = this.getFieldValue(formData, fieldName);
        const actualValue = typeof fieldValueFromData === 'number' ? fieldValueFromData : parseFloat(String(fieldValueFromData));
        return !isNaN(actualValue) && actualValue < threshold;
      }
    }

    // Default to simple check if condition parsing fails
    return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
  }

  private evaluateCondition(expression: string, formData: ContractFormData): boolean {
    if (!expression) return false;

    try {
      // Handle complex logical expressions with AND, OR
      if (expression.includes(' AND ')) {
        const parts = expression.split(' AND ');
        return parts.every(part => this.evaluateCondition(part.trim(), formData));
      }
      
      if (expression.includes(' OR ')) {
        const parts = expression.split(' OR ');
        return parts.some(part => this.evaluateCondition(part.trim(), formData));
      }

      // Handle clause inclusion checks
      if (expression.includes(' CONTAINS ')) {
        const match = expression.match(/([\w\.]+)\s+CONTAINS\s+"([^"]+)"/);
        if (match) {
          const fieldName = match[1];
          const expected = match[2];
          const fieldValue = this.getFieldValue(formData, fieldName);
          if (Array.isArray(fieldValue)) {
            return fieldValue.includes(expected);
          }
          if (typeof fieldValue === 'string') {
            return fieldValue === expected;
          }
          return false;
        }
      }

      // Handle equality checks
      if (expression.includes(' == ') || expression.includes(' = ')) {
        const match = expression.match(/([\w\.]+)\s*==?\s*["']?([^"']+)["']?$/);
        if (match) {
          const fieldName = match[1];
          const expected = match[2];
          const fieldValue = this.getFieldValue(formData, fieldName);
          return String(fieldValue) === expected;
        }
      }

      // Handle inequality checks
      if (expression.includes(' != ')) {
        const match = expression.match(/([\w\.]+)\s*!=\s*["']?([^"']+)["']?$/);
        if (match) {
          const fieldName = match[1];
          const expected = match[2];
          const fieldValue = this.getFieldValue(formData, fieldName);
          return String(fieldValue) !== expected;
        }
      }

      // Numeric comparisons
      if (expression.includes('<=')) {
        const match = expression.match(/([\w\.]+)\s*<=\s*([\d\.]+)/);
        if (match) {
          const fieldName = match[1];
          const threshold = parseFloat(match[2]);
          const fieldValue = this.getFieldValue(formData, fieldName);
          const actualValue = parseFloat(fieldValue as any);
          return !isNaN(actualValue) && actualValue <= threshold;
        }
      }

      if (expression.includes('>=')) {
        const match = expression.match(/([\w\.]+)\s*>=\s*([\d\.]+)/);
        if (match) {
          const fieldName = match[1];
          const threshold = parseFloat(match[2]);
          const fieldValue = this.getFieldValue(formData, fieldName);
          const actualValue = parseFloat(fieldValue as any);
          return !isNaN(actualValue) && actualValue >= threshold;
        }
      }

      if (expression.includes('<')) {
        const match = expression.match(/([\w\.]+)\s*<\s*([\d\.]+)/);
        if (match) {
          const fieldName = match[1];
          const threshold = parseFloat(match[2]);
          const fieldValue = this.getFieldValue(formData, fieldName);
          const actualValue = parseFloat(fieldValue as any);
          return !isNaN(actualValue) && actualValue < threshold;
        }
      }

      if (expression.includes('>')) {
        const match = expression.match(/([\w\.]+)\s*>\s*([\d\.]+)/);
        if (match) {
          const fieldName = match[1];
          const threshold = parseFloat(match[2]);
          const fieldValue = this.getFieldValue(formData, fieldName);
          const actualValue = parseFloat(fieldValue as any);
          return !isNaN(actualValue) && actualValue > threshold;
        }
      }

      // Check if field is filled
      if (expression.includes(' IS NOT NULL') || expression.includes(' IS SET')) {
        const match = expression.match(/([\w\.]+)\s+IS\s+(?:NOT\s+NULL|SET)/);
        if (match) {
          const fieldName = match[1];
          const fieldValue = this.getFieldValue(formData, fieldName);
          return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
        }
      }

      // Check if field is empty
      if (expression.includes(' IS NULL') || expression.includes(' IS EMPTY')) {
        const match = expression.match(/([\w\.]+)\s+IS\s+(?:NULL|EMPTY)/);
        if (match) {
          const fieldName = match[1];
          const fieldValue = this.getFieldValue(formData, fieldName);
          return fieldValue === null || fieldValue === undefined || fieldValue === '';
        }
      }

      // Default to false for unsupported conditions
      return false;
    } catch (error) {
      console.warn('Condition evaluation failed:', error);
      return false;
    }
  }

  private evaluateDefault(expression: string, formData: ContractFormData): string {
    if (!expression) return '';

    try {
      // Handle simple default values
      if (expression.startsWith("'") && expression.endsWith("'")) {
        return expression.slice(1, -1); // Remove quotes
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

  private formatValue(value: string | number | boolean): string {
    if (typeof value === 'string') {
      return `"${value}"`;
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    if (typeof value === 'boolean') {
      return value.toString();
    }
    return 'null';
  }

  private safeEval(expression: string): boolean {
    // Very limited safe evaluation - no AI, deterministic
    // Only allow basic comparisons and logical operators
    
    // Whitelist allowed characters and operators
    const allowedPattern = /^[\d\s"'.=><!&|()]+$/;
    if (!allowedPattern.test(expression)) {
      throw new Error('Unsafe expression');
    }

    try {
      // Use Function constructor for safer evaluation
      const result = new Function('return ' + expression)();
      return Boolean(result);
    } catch (error) {
      console.warn('Safe eval failed:', expression, error);
      return false;
    }
  }

  // Apply default values to form data
  applyDefaults(formData: ContractFormData, defaults: DefaultValue[]): ContractFormData {
    const updatedData = { ...formData };

    defaults.forEach((defaultValue) => {
      const field = defaultValue.field as keyof ContractFormData;
      if (field in updatedData) {
        (updatedData as any)[field] = defaultValue.value;
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
