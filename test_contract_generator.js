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
    // Test 1: Fetch Templates
    console.log('📋 Test 1: Fetching Templates...');
    const templatesResponse = await fetch(`${API_BASE}/contracts/templates`);
    const templatesData = await templatesResponse.json();
    
    if (!templatesData.ok) {
      throw new Error(`Templates API failed: ${templatesData.error}`);
    }
    
    console.log(`✅ Found ${templatesData.templates.length} templates`);
    console.log(`✅ Found ${templatesData.clauses.length} clauses`);
    console.log(`✅ Found ${templatesData.validationRules.length} validation rules\n`);

    // Test 2: Validate Template Structure
    console.log('🔍 Test 2: Validating Template Structure...');
    const cdiTemplate = templatesData.templates.find(t => t.contract_type === 'CDI');
    
    if (!cdiTemplate) {
      throw new Error('CDI template not found');
    }
    
    console.log(`✅ CDI Template: ${cdiTemplate.title}`);
    console.log(`✅ Sections: ${cdiTemplate.sections.length}`);
    
    // Check for required variables
    const templateContent = cdiTemplate.sections.map(s => s.content).join('\n');
    const requiredVars = ['{{company_name}}', '{{employee_name}}', '{{salary_brut}}', '{{job_title}}'];
    
    for (const varName of requiredVars) {
      if (!templateContent.includes(varName)) {
        console.log(`⚠️  Warning: Missing variable ${varName}`);
      } else {
        console.log(`✅ Found variable ${varName}`);
      }
    }
    console.log('');

    // Test 3: Contract Generation
    console.log('📝 Test 3: Generating Contract...');
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
      throw new Error(`Generation failed: ${generateData.error}`);
    }
    
    console.log('✅ Contract generated successfully!');
    console.log(`✅ Contract ID: ${generateData.contract.id}`);
    console.log(`✅ Warnings: ${generateData.contract.warnings?.length || 0}`);
    
    // Test 4: Output Quality
    console.log('\n📄 Test 4: Analyzing Output Quality...');
    const contractContent = generateData.contract.content;
    
    // Check for variable injection
    const injectedVars = [
      { name: 'company_name', expected: 'Société Test Maroc' },
      { name: 'employee_name', expected: 'Mohammed Alami' },
      { name: 'salary_brut', expected: '15000' },
      { name: 'job_title', expected: 'Développeur Senior' }
    ];
    
    for (const variable of injectedVars) {
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
    
    // Test 5: Legal Compliance
    console.log('\n⚖️  Test 5: Legal Compliance Check...');
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
    
    // Test 6: Output Format
    console.log('\n📊 Test 6: Output Format Analysis...');
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
