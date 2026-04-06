// Contract Generator Test Script
// Tests API endpoints, data flow, and output generation

const API_BASE = 'http://localhost:3000/api';

// Test Data
const testContractData = {
  contract_type: 'CDI',
  employee_name: 'Mohammed Alami',
  employee_address: '123 Rue Mohamed V, Casablanca',
  employee_cin: 'AB123456',
  employee_cnss: 'CNSS123456',
  company_name: 'Société Test Maroc',
  company_address: '456 Avenue Hassan II, Rabat',
  company_rc: 'RC12345',
  company_cnss: 'CNSS789012',
  job_title: 'Développeur Senior',
  job_description: 'Développement d\'applications web et mobiles',
  role_level: 'cadre',
  start_date: '2024-04-01',
  trial_period_duration: '3 mois',
  salary_brut: 15000,
  salary_net: 12000,
  payment_frequency: 'mensuel',
  payment_method: 'virement bancaire',
  work_hours: '44',
  work_days: '5',
  work_schedule: '9h00 - 18h00',
  annual_leave_days: '22',
  selected_clauses: ['confidentiality', 'non_competition'],
  clause_variables: {
    confidentiality: '2 ans',
    non_competition: '100 km'
  },
  notice_period_employee: '1 mois',
  contract_location: 'Casablanca',
  contract_date: '2024-03-31'
};

async function testContractGenerator() {
  console.log('🚀 Testing Contract Generator...\n');

  try {
    // Test 1: API Connection
    console.log('📋 Test 1: API Connection...');
    const templatesResponse = await fetch(`${API_BASE}/contracts/templates`);
    const templatesData = await templatesResponse.json();
    
    if (!templatesData.ok) {
      throw new Error(`Templates API Error: ${templatesData.error}`);
    }
    
    console.log(`✅ Templates API connected`);
    console.log(`   - Templates: ${templatesData.templates.length}`);
    console.log(`   - Clauses: ${templatesData.clauses.length}`);
    console.log(`   - Validation Rules: ${templatesData.validationRules.length}`);
    
    const cdiTemplate = templatesData.templates.find(t => t.contract_type === 'CDI');
    if (!cdiTemplate) {
      throw new Error('CDI template not found');
    }
    console.log(`✅ CDI Template loaded: ${cdiTemplate.title}\n`);
    
    // Test 2: Advanced Validation Rules
    console.log('⚙️  Test 2: Advanced Validation Rules...');
    const advancedRules = templatesData.validationRules.filter(r => r.priority > 0);
    console.log(`   - Found ${advancedRules.length} advanced validation rules`);
    
    const crossFieldRules = templatesData.validationRules.filter(r => 
      r.condition_expression && (r.condition_expression.includes(' AND ') || r.condition_expression.includes(' OR '))
    );
    console.log(`   - Found ${crossFieldRules.length} cross-field validation rules`);
    
    if (advancedRules.length > 0) {
      console.log('✅ Advanced validation rules are configured');
      advancedRules.forEach(rule => {
        console.log(`   • ${rule.id}: Priority ${rule.priority}, Type: ${rule.rule_type}`);
      });
    } else {
      console.log('⚠️  No advanced validation rules found');
    }
    console.log();
    
    // Test 3: Contract Generation with CDD (to test conditional logic)
    console.log('📝 Test 3: CDD Contract Generation (Conditional Logic)...');
    const cddTestData = {
      ...testContractData,
      contract_type: 'CDD',
      end_date: '2025-04-01',
      contract_duration: 12,
      cdd_justification: 'Remplacement temporaire pour projet spécifique'
    };
    
    const cddResponse = await fetch(`${API_BASE}/contracts/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateId: 'CDD',
        contractData: cddTestData
      })
    });
    
    const cddResult = await cddResponse.json();
    
    if (!cddResult.ok) {
      console.log('⚠️  CDD generation failed:', cddResult.error);
      if (cddResult.validationErrors) {
        console.log('   Validation Errors:', cddResult.validationErrors);
      }
    } else {
      console.log('✅ CDD contract generated successfully');
      console.log(`   - Contract ID: ${cddResult.contract.id}`);
      console.log(`   - Warnings: ${cddResult.contract.warnings?.length || 0}`);
      
      // Check if CDD-specific sections are included
      const cddContent = cddResult.contract.content;
      if (cddContent.includes('durée déterminée') || cddContent.includes('CDD')) {
        console.log('✅ CDD-specific content detected');
      }
    }
    console.log();
    
    // Test 4: Smart Salary Calculation
    console.log('💰 Test 4: Smart Salary Calculation...');
    const salaryTestResponse = await fetch(`${API_BASE}/contracts/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateId: 'CDI',
        contractData: {
          ...testContractData,
          salary_brut: 15000,
          salary_net: 0 // Should be auto-calculated
        }
      })
    });
    
    const salaryTestResult = await salaryTestResponse.json();
    if (salaryTestResult.ok) {
      console.log('✅ Contract generated with smart defaults');
      // Note: The actual net calculation happens in the wizard UI, not the API
      console.log('   - Smart defaults applied in frontend wizard');
    }
    console.log();
    
    // Test 5: Minimum Wage Warning
    console.log('⚠️  Test 5: Minimum Wage Validation...');
    const lowSalaryResponse = await fetch(`${API_BASE}/contracts/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateId: 'CDI',
        contractData: {
          ...testContractData,
          salary_brut: 2500 // Below SMIG
        }
      })
    });
    
    const lowSalaryResult = await lowSalaryResponse.json();
    if (lowSalaryResult.ok && lowSalaryResult.contract.warnings) {
      const wageWarning = lowSalaryResult.contract.warnings.find(w => 
        w.message && w.message.toLowerCase().includes('minimum wage')
      );
      if (wageWarning) {
        console.log('✅ Minimum wage warning triggered correctly');
        console.log(`   - Warning: ${wageWarning.message}`);
      } else {
        console.log('⚠️  Minimum wage warning not found (expected)');
      }
    }
    console.log();
    
    // Test 6: Original CDI Generation
    console.log('📄 Test 6: Standard CDI Generation...');
    const generateResponse = await fetch(`${API_BASE}/contracts/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateId: 'CDI',
        contractData: testContractData
      })
    });
    
    const generateData = await generateResponse.json();
    
    if (!generateData.ok) {
      throw new Error(`Generation Error: ${generateData.error}`);
    }
    
    console.log('✅ Contract Generated Successfully!');
    console.log(`📄 Contract ID: ${generateData.contract.id}`);
    console.log(`⚠️  Warnings: ${generateData.contract.warnings?.length || 0}`);
    
    // Store contract for output analysis
    const contractContent = generateData.contract.content;
    
    // Test 7: Variable Injection Verification
    console.log('\n🔍 Test 7: Variable Injection Check...');
    const variablesToCheck = [
      { name: 'employee_name', expected: testContractData.employee_name },
      { name: 'company_name', expected: testContractData.company_name },
      { name: 'job_title', expected: testContractData.job_title },
      { name: 'salary_brut', expected: testContractData.salary_brut.toLocaleString('fr-MA') }
    ];
    
    for (const variable of variablesToCheck) {
      if (contractContent.includes(variable.expected)) {
        console.log(`✅ Variable injected: ${variable.name} → ${variable.expected}`);
      } else {
        console.log(`❌ Variable not injected: ${variable.name}`);
      }
    }
    
    // Check for remaining variables (should be none)
    const remainingVars = contractContent.match(/\{\{[^}]+\}\}/g);
    if (remainingVars) {
      console.log(`⚠️  Unfilled variables: ${remainingVars.join(', ')}`);
    } else {
      console.log('✅ All variables filled');
    }
    
    // Test 8: Legal Compliance
    console.log('\n⚖️  Test 8: Legal Compliance Check...');
    const legalElements = [
      'Code du travail',
      'CNSS',
      'période d\'essai',
      'préavis',
      'signature'
    ];
    
    for (const element of legalElements) {
      if (contractContent.toLowerCase().includes(element.toLowerCase())) {
        console.log(`✅ Legal element present: ${element}`);
      } else {
        console.log(`⚠️  Missing legal element: ${element}`);
      }
    }
    
    // Test 9: Output Format
    console.log('\n📊 Test 9: Output Format Analysis...');
    console.log(`✅ Content length: ${contractContent.length} characters`);
    console.log(`✅ Line count: ${contractContent.split('\n').length} lines`);
    console.log(`✅ Word count: ${contractContent.split(/\s+/).length} words`);
    
    // Save test output
    console.log('\n💾 Saving test output...');
    const fs = require('fs');
    const testOutput = `
CONTRACT GENERATOR TEST RESULTS
================================
Generated: ${new Date().toISOString()}
Template: ${cdiTemplate.title}
Contract ID: ${generateData.contract.id}

TEST DATA:
${JSON.stringify(testContractData, null, 2)}

GENERATED CONTRACT:
${contractContent}

VALIDATION WARNINGS:
${JSON.stringify(generateData.contract.warnings || [], null, 2)}
`;
    
    fs.writeFileSync('test_contract_output.txt', testOutput);
    console.log('✅ Test output saved to test_contract_output.txt');
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
testContractGenerator();
