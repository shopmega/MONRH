// Type Verification Tests for Contract Generator
// Ensures all interfaces and data structures are correctly typed

import type { 
  ContractFormData, 
  ContractTemplate, 
  ContractClause, 
  ValidationRule,
  ValidationResult,
  ContractPreview 
} from './types';

// Test Data Type Verification
function verifyTypes() {
  console.log('🔍 Verifying Contract Generator Types...\n');

  // 1. ContractFormData Type Test
  const validContractData: ContractFormData = {
    // Employee Information
    employee_name: 'Mohammed Alami',
    employee_address: '123 Rue Mohamed V, Casablanca',
    employee_cin: 'AB123456',
    employee_cnss: 'CNSS123456',
    
    // Company Information
    company_name: 'Société Test Maroc',
    company_address: '456 Avenue Hassan II, Rabat',
    company_rc: 'RC12345',
    company_cnss: 'CNSS789012',
    
    // Job Information
    job_title: 'Développeur Senior',
    job_description: 'Développement d\'applications web et mobiles',
    role_level: 'cadre', // Must be 'cadre' | 'employee'
    
    // Contract Details
    contract_type: 'CDI', // Must be 'CDI' | 'CDD' | 'INTERIM' | 'STAGE'
    start_date: '2024-04-01',
    end_date: undefined, // Optional for CDD
    contract_duration: undefined, // Optional for CDD
    cdd_justification: undefined, // Optional for CDD
    
    // Trial Period
    trial_period_duration: '3 mois',
    
    // Salary
    salary_brut: 15000, // Must be number
    salary_net: 12000, // Optional
    payment_frequency: 'mensuel',
    payment_method: 'virement bancaire',
    
    // Work Conditions
    work_hours: '44',
    work_days: '5',
    work_schedule: '9h00 - 18h00',
    
    // Leave
    annual_leave_days: '22',
    
    // Clauses
    selected_clauses: ['confidentiality', 'non_competition'], // Must be string[]
    clause_variables: { // Must be Record<string, string>
      confidentiality: '2 ans',
      non_competition: '100 km'
    },
    
    // Termination
    notice_period_employee: '1 mois',
    
    // Contract Metadata
    contract_location: 'Casablanca',
    contract_date: '2024-03-31'
  };

  console.log('✅ ContractFormData type validation passed');
  console.log(`   - Employee: ${validContractData.employee_name}`);
  console.log(`   - Company: ${validContractData.company_name}`);
  console.log(`   - Contract Type: ${validContractData.contract_type}`);
  console.log(`   - Role Level: ${validContractData.role_level}`);
  console.log(`   - Salary: ${validContractData.salary_brut} MAD`);
  console.log(`   - Clauses: ${validContractData.selected_clauses.length} selected`);

  // 2. ContractTemplate Type Test
  const validTemplate: ContractTemplate = {
    id: 'CDI',
    title: 'Contrat de Travail à Durée Indéterminée (CDI)',
    description: 'Modèle de contrat CDI conforme au Code du travail marocain',
    contract_type: 'CDI',
    sections: [
      {
        id: 'header',
        title: 'Entête',
        order: 1,
        content: 'CONTRAT DE TRAVAIL À DURÉE INDÉTERMINÉE\nEntre les soussignés:'
      },
      {
        id: 'parties',
        title: 'Parties',
        order: 2,
        content: 'L\'employeur: {{company_name}}\nLe salarié: {{employee_name}}'
      }
    ],
    is_active: true,
    created_at: '2024-03-31T12:00:00Z',
    updated_at: '2024-03-31T12:00:00Z'
  };

  console.log('\n✅ ContractTemplate type validation passed');
  console.log(`   - Template ID: ${validTemplate.id}`);
  console.log(`   - Contract Type: ${validTemplate.contract_type}`);
  console.log(`   - Sections: ${validTemplate.sections.length}`);
  console.log(`   - Active: ${validTemplate.is_active}`);

  // 3. ContractClause Type Test
  const validClause: ContractClause = {
    id: 'confidentiality',
    title: 'Clause de Confidentialité',
    content: 'Le salarié s\'engage à garder confidentielles toutes les informations...',
    category: 'confidentiality', // Must be one of the approved categories
    is_active: true,
    created_at: '2024-03-31T12:00:00Z',
    updated_at: '2024-03-31T12:00:00Z'
  };

  console.log('\n✅ ContractClause type validation passed');
  console.log(`   - Clause ID: ${validClause.id}`);
  console.log(`   - Category: ${validClause.category}`);
  console.log(`   - Active: ${validClause.is_active}`);

  // 4. ValidationRule Type Test
  const validRule: ValidationRule = {
    id: 'salary_required',
    contract_type: 'CDI',
    rule_type: 'required', // Must be 'required' | 'warning' | 'default'
    field_path: 'salary_brut',
    condition_expression: 'salary_brut > 0',
    error_message: 'Le salaire brut est obligatoire',
    is_active: true,
    created_at: '2024-03-31T12:00:00Z'
  };

  console.log('\n✅ ValidationRule type validation passed');
  console.log(`   - Rule ID: ${validRule.id}`);
  console.log(`   - Rule Type: ${validRule.rule_type}`);
  console.log(`   - Field: ${validRule.field_path}`);

  // 5. ValidationResult Type Test
  const validValidationResult: ValidationResult = {
    isValid: false,
    errors: [
      {
        rule_id: 'employee_name_required',
        field: 'employee_name',
        message: 'Le nom du salarié est obligatoire',
        rule_type: 'required'
      }
    ],
    warnings: [
      {
        rule_id: 'salary_smig_warning',
        field: 'salary_brut',
        message: 'Attention: le salaire est inférieur au SMIG (3000 MAD)',
        rule_type: 'warning'
      }
    ],
    defaults: [
      {
        rule_id: 'payment_frequency_default',
        field: 'payment_frequency',
        value: 'mensuel',
        rule_type: 'default'
      }
    ]
  };

  console.log('\n✅ ValidationResult type validation passed');
  console.log(`   - Is Valid: ${validValidationResult.isValid}`);
  console.log(`   - Errors: ${validValidationResult.errors.length}`);
  console.log(`   - Warnings: ${validValidationResult.warnings.length}`);
  console.log(`   - Defaults: ${validValidationResult.defaults.length}`);

  // 6. ContractPreview Type Test
  const validPreview: ContractPreview = {
    template_id: 'CDI',
    sections: [
      {
        id: 'header',
        title: 'Entête',
        content: 'CONTRAT DE TRAVAIL À DURÉE INDÉTERMINÉE\nEntre les soussignés:',
        variables: []
      },
      {
        id: 'parties',
        title: 'Parties',
        content: 'L\'employeur: Société Test Maroc\nLe salarié: Mohammed Alami',
        variables: [
          { name: 'company_name', value: 'Société Test Maroc', injected: true },
          { name: 'employee_name', value: 'Mohammed Alami', injected: true }
        ]
      }
    ],
    completeness: 0.8,
    missing_variables: ['start_date', 'trial_period_duration']
  };

  console.log('\n✅ ContractPreview type validation passed');
  console.log(`   - Template ID: ${validPreview.template_id}`);
  console.log(`   - Sections: ${validPreview.sections.length}`);
  console.log(`   - Completeness: ${(validPreview.completeness * 100).toFixed(1)}%`);
  console.log(`   - Missing Variables: ${validPreview.missing_variables.length}`);

  // 7. Edge Cases and Constraints
  console.log('\n🧪 Testing Edge Cases...');

  // Test CDD specific fields
  const cddData: ContractFormData = {
    ...validContractData,
    contract_type: 'CDD',
    end_date: '2024-12-31', // Required for CDD
    contract_duration: 9, // Required for CDD
    cdd_justification: 'Remplacement temporaire' // Required for CDD
  };

  console.log('✅ CDD specific fields validated');

  // Test empty clauses and variables
  const emptyClausesData: ContractFormData = {
    ...validContractData,
    selected_clauses: [],
    clause_variables: {}
  };

  console.log('✅ Empty clauses and variables validated');

  // Test all contract types
  const contractTypes: Array<ContractFormData['contract_type']> = ['CDI', 'CDD', 'INTERIM', 'STAGE'];
  contractTypes.forEach(type => {
    const testData: ContractFormData = { ...validContractData, contract_type: type };
    console.log(`✅ Contract type ${type} validated`);
  });

  // Test all role levels
  const roleLevels: Array<ContractFormData['role_level']> = ['cadre', 'employee'];
  roleLevels.forEach(level => {
    const testData: ContractFormData = { ...validContractData, role_level: level };
    console.log(`✅ Role level ${level} validated`);
  });

  // Test all clause categories
  const clauseCategories: Array<ContractClause['category']> = [
    'confidentiality', 'non_competition', 'exclusivity', 'mobility', 
    'training', 'intellectual_property', 'probation_extension', 'remote_work'
  ];
  clauseCategories.forEach(category => {
    const testClause: ContractClause = { ...validClause, category };
    console.log(`✅ Clause category ${category} validated`);
  });

  console.log('\n🎉 All type verifications passed successfully!');
  console.log('\n📊 Summary:');
  console.log('   ✅ ContractFormData - Complete with all required fields');
  console.log('   ✅ ContractTemplate - Proper structure with sections');
  console.log('   ✅ ContractClause - All categories supported');
  console.log('   ✅ ValidationRule - All rule types supported');
  console.log('   ✅ ValidationResult - Error/warning/default handling');
  console.log('   ✅ ContractPreview - Variable injection tracking');
  console.log('   ✅ Edge Cases - CDD, empty data, all enum values');

  return {
    contractData: validContractData,
    template: validTemplate,
    clause: validClause,
    rule: validRule,
    validationResult: validValidationResult,
    preview: validPreview
  };
}

// Export for use in tests
export { verifyTypes };
export type { 
  ContractFormData, 
  ContractTemplate, 
  ContractClause, 
  ValidationRule,
  ValidationResult,
  ContractPreview 
};

// Auto-run in development
if (typeof window === 'undefined') {
  // Running in Node.js environment
  try {
    verifyTypes();
  } catch (error) {
    console.error('❌ Type verification failed:', error);
    process.exit(1);
  }
}
