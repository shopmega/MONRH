import { ContractFormData } from './types';

/**
 * Shared condition evaluator for the Contract Generator.
 * Used by both ValidationEngine (for rules) and TemplateEngine (for section visibility).
 * Supports a SQL-like DSL: AND, OR, CONTAINS, ==, !=, <, >, <=, >=, IS NOT NULL, IS SET.
 */
export class ContractConditionEvaluator {
  /**
   * Evaluates a DSL expression against form data.
   */
  public static evaluate(expression: string | null | undefined, formData: ContractFormData): boolean {
    if (!expression) return true; // No expression means condition is satisfied/visible

    try {
      // Handle complex logical expressions with AND, OR (recursive)
      if (expression.includes(' AND ')) {
        const parts = expression.split(' AND ');
        return parts.every(part => this.evaluate(part.trim(), formData));
      }
      
      if (expression.includes(' OR ')) {
        const parts = expression.split(' OR ');
        return parts.some(part => this.evaluate(part.trim(), formData));
      }

      // 1. Handle clause inclusion checks (e.g. "selected_clauses CONTAINS \"notice_period\"")
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

      // 2. Handle equality checks (e.g. "contract_type == \"CDI\"")
      if (expression.includes(' == ') || expression.includes(' = ')) {
        const match = expression.match(/([\w\.]+)\s*==?\s*["']?([^"']+)["']?$/);
        if (match) {
          const fieldName = match[1];
          const expected = match[2];
          const fieldValue = this.getFieldValue(formData, fieldName);
          return String(fieldValue ?? '') === expected;
        }
      }

      // 3. Handle inequality checks (e.g. "contract_type != \"STAGE\"")
      if (expression.includes(' != ')) {
        const match = expression.match(/([\w\.]+)\s*!=\s*["']?([^"']+)["']?$/);
        if (match) {
          const fieldName = match[1];
          const expected = match[2];
          const fieldValue = this.getFieldValue(formData, fieldName);
          return String(fieldValue ?? '') !== expected;
        }
      }

      // 4. Handle Null/Set checks (e.g. "salary_brut IS NOT NULL")
      if (expression.includes(' IS NOT NULL') || expression.includes(' IS SET')) {
        const match = expression.match(/([\w\.]+)\s+IS\s+(?:NOT\s+NULL|SET)/);
        if (match) {
          const fieldName = match[1];
          const fieldValue = this.getFieldValue(formData, fieldName);
          return fieldValue !== null && fieldValue !== undefined && String(fieldValue).trim() !== '';
        }
      }

      // 5. Numeric comparisons (e.g. "salary_brut > 0")
      // Check for <=, >= first to avoid matching < or > partially
      const numericMatch = expression.match(/([\w\.]+)\s*(<=|>=|<|>)\s*([\d\.]+)/);
      if (numericMatch) {
        const fieldName = numericMatch[1];
        const operator = numericMatch[2];
        const threshold = parseFloat(numericMatch[3]);
        const fieldValue = this.getFieldValue(formData, fieldName);
        const actualValue = parseFloat(String(fieldValue ?? '0'));
        
        if (isNaN(actualValue)) return false;

        switch (operator) {
          case '<=': return actualValue <= threshold;
          case '>=': return actualValue >= threshold;
          case '<': return actualValue < threshold;
          case '>': return actualValue > threshold;
          default: return false;
        }
      }

      return true; // Default to true if expression is unparseable but not empty
    } catch (error) {
      console.warn('[ConditionEvaluator] Evaluation failed:', expression, error);
      return false;
    }
  }

  /**
   * Safely gets a field value from ContractFormData, supporting dot notation.
   */
  public static getFieldValue(formData: ContractFormData, path: string): any {
    if (!path || !formData) return undefined;
    
    // Check if it's a direct property
    if (path in formData) {
      return (formData as any)[path];
    }
    
    // Support dot notation for nested objects if added in future
    const parts = path.split('.');
    let current: any = formData;
    
    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = current[part];
    }
    
    return current;
  }
}
