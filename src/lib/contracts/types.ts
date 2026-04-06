// Contract Generator Types - No-AI, Template-driven System

export interface ContractTemplate {
  id: string;
  title: string;
  description: string;
  contract_type: 'CDI' | 'CDD' | 'INTERIM' | 'STAGE';
  sections: ContractSection[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContractSection {
  id: string;
  title: string;
  order: number;
  content: string; // Template with {{variables}}
  condition_expression?: string; // Optional condition to include/exclude section
}

export interface ContractClause {
  id: string;
  title: string;
  content: string;
  category: 'confidentiality' | 'non_competition' | 'exclusivity' | 'mobility' | 'training' | 'intellectual_property' | 'probation_extension' | 'remote_work';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ValidationRule {
  id: string;
  contract_type: string;
  rule_type: 'required' | 'warning' | 'default';
  field_path: string;
  condition_expression?: string;
  value_expression?: string;
  error_message?: string;
  is_active: boolean;
  priority?: number; // Higher priority rules are evaluated first
  logic_config?: {
    cross_field_dependencies?: string[];
    smart_defaults?: Record<string, any>;
    visibility_rules?: string;
  };
  created_at: string;
}

export interface ContractFormData {
  // Employee Information
  employee_name: string;
  employee_address: string;
  employee_cin: string;
  employee_cnss: string;
  
  // Company Information
  company_name: string;
  company_address: string;
  company_rc: string;
  company_cnss: string;
  
  // Job Information
  job_title: string;
  job_description: string;
  role_level: 'cadre' | 'employee';
  
  // Contract Details
  contract_type: 'CDI' | 'CDD' | 'INTERIM' | 'STAGE';
  start_date: string;
  end_date?: string; // For CDD
  contract_duration?: number; // For CDD in months
  cdd_justification?: string; // For CDD
  
  // Trial Period
  trial_period_duration: string;
  
  // Salary
  salary_brut: number;
  salary_net?: number;
  payment_frequency: string;
  payment_method: string;
  
  // Work Conditions
  work_hours: string;
  work_days: string;
  work_schedule: string;
  
  // Leave
  annual_leave_days: string;
  
  // Clauses
  selected_clauses: string[];
  clause_variables: Record<string, string>; // Variables for selected clauses
  
  // Termination
  notice_period_employee: string;
  
  // Contract Metadata
  contract_location: string;
  contract_date: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  defaults: DefaultValue[];
}

export interface ValidationError {
  field: string;
  message: string;
  rule_id: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  rule_id: string;
}

export interface DefaultValue {
  field: string;
  value: string;
  rule_id: string;
}

export interface GeneratedContract {
  id: string;
  template_id: string;
  contract_data: ContractFormData;
  rendered_content: string;
  file_path?: string;
  created_at: string;
}

export interface ClauseSelection {
  clause_id: string;
  selected: boolean;
  variables: Record<string, string>;
}

export interface ContractWizardStep {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
}

export interface FormField {
  id: keyof ContractFormData;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'company' | 'employee';
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  depends_on?: {
    field: keyof ContractFormData;
    value: any;
  };
  logic?: {
    visibility_condition?: string; // Expression to determine field visibility
    default_value_expression?: string; // Expression to calculate default value
    smart_suggestions?: string[]; // Field IDs that provide suggestions for this field
  };
}

export interface ContractPreview {
  sections: {
    id: string;
    title: string;
    content: string;
  }[];
  variables: Record<string, string>;
  is_complete: boolean;
  completion_percentage: number;
}
