"use client";

import { useState } from "react";

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

export default function ContractTestPage() {
  const [apiResult, setApiResult] = useState<TestResult | null>(null);
  const [generationResult, setGenerationResult] = useState<TestResult | null>(null);
  const [outputResult, setOutputResult] = useState<TestResult | null>(null);
  const [testLog, setTestLog] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const log = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setTestLog(prev => [...prev, logEntry]);
    console.log(logEntry);
  };

  const testAPI = async () => {
    setLoading(true);
    setApiResult(null);
    
    try {
      log('🚀 Starting API Test...');
      
      const response = await fetch('/api/contracts/templates');
      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(`API Error: ${data.error}`);
      }
      
      log(`✅ API Connection Successful`);
      log(`📋 Found ${data.templates.length} templates`);
      log(`📋 Found ${data.clauses.length} clauses`);
      log(`📋 Found ${data.validationRules.length} validation rules`);
      
      const cdiTemplate = data.templates.find((t: any) => t.contract_type === 'CDI');
      if (cdiTemplate) {
        log(`✅ CDI Template Found: ${cdiTemplate.title}`);
        log(`📄 CDI has ${cdiTemplate.sections.length} sections`);
      } else {
        log('❌ CDI Template Not Found', 'error');
      }
      
      setApiResult({
        success: true,
        message: 'API Test Passed',
        details: {
          templates: data.templates.length,
          clauses: data.clauses.length,
          rules: data.validationRules.length
        }
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log(`❌ API Test Failed: ${errorMessage}`, 'error');
      setApiResult({
        success: false,
        message: `API Test Failed: ${errorMessage}`
      });
    } finally {
      setLoading(false);
    }
  };

  const testGeneration = async () => {
    setLoading(true);
    setGenerationResult(null);
    
    const testData = {
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
    
    try {
      log('📝 Starting Contract Generation Test...');
      
      const response = await fetch('/api/contracts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: 'CDI',
          contractData: testData
        })
      });
      
      const data = await response.json();
      
      if (!data.ok) {
        // Show detailed validation errors if available
        if (data.validationErrors && data.validationErrors.length > 0) {
          const errorMessages = data.validationErrors.map((e: any) => `${e.field}: ${e.message}`).join('\n');
          throw new Error(`Validation failed:\n${errorMessages}`);
        }
        throw new Error(`Generation Error: ${data.error}`);
      }
      
      log('✅ Contract Generated Successfully!');
      log(`📄 Contract ID: ${data.contract.id}`);
      log(`⚠️  Warnings: ${data.contract.warnings?.length || 0}`);
      
      // Store contract for output analysis
      (window as any).lastGeneratedContract = data.contract;
      
      setGenerationResult({
        success: true,
        message: 'Contract Generated',
        details: {
          id: data.contract.id,
          contentLength: data.contract.content.length,
          warnings: data.contract.warnings?.length || 0
        }
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log(`❌ Generation Test Failed: ${errorMessage}`, 'error');
      setGenerationResult({
        success: false,
        message: `Generation Failed: ${errorMessage}`
      });
    } finally {
      setLoading(false);
    }
  };

  const testOutput = () => {
    setOutputResult(null);
    
    const contract = (window as any).lastGeneratedContract;
    if (!contract) {
      log('⚠️ Please generate a contract first', 'warning');
      setOutputResult({
        success: false,
        message: 'Please generate a contract first'
      });
      return;
    }
    
    const content = contract.content;
    
    log('🔍 Starting Output Analysis...');
    
    const analysis = {
      totalLength: content.length,
      lines: content.split('\n').length,
      words: content.split(/\s+/).length,
      variablesInjected: 0,
      variablesMissing: 0,
      legalElements: 0
    };
    
    // Check variable injection
    const expectedInjections = [
      { name: 'company_name', expected: 'Société Test Maroc' },
      { name: 'employee_name', expected: 'Mohammed Alami' },
      { name: 'salary_brut', expected: '15000' },
      { name: 'job_title', expected: 'Développeur Senior' }
    ];
    
    let injectionResults: string[] = [];
    expectedInjections.forEach(variable => {
      if (content.includes(variable.expected)) {
        analysis.variablesInjected++;
        injectionResults.push(`✅ ${variable.name}: ${variable.expected}`);
        log(`✅ Variable injected: ${variable.name}`);
      } else {
        analysis.variablesMissing++;
        injectionResults.push(`❌ ${variable.name}: NOT FOUND`);
        log(`❌ Variable not injected: ${variable.name}`, 'error');
      }
    });
    
    // Check for remaining variables
    const remainingVars = content.match(/\{\{[^}]+\}\}/g);
    if (remainingVars) {
      analysis.variablesMissing += remainingVars.length;
      log(`⚠️ Unfilled variables: ${remainingVars.join(', ')}`, 'warning');
    } else {
      log('✅ All variables filled');
    }
    
    // Check legal elements
    const legalElements = ['Code du travail', 'CNSS', 'période d\'essai', 'préavis', 'signature'];
    legalElements.forEach(element => {
      if (content.toLowerCase().includes(element.toLowerCase())) {
        analysis.legalElements++;
        log(`✅ Legal element found: ${element}`);
      } else {
        log(`⚠️ Missing legal element: ${element}`, 'warning');
      }
    });
    
    log('📊 Output Analysis Complete');
    
    setOutputResult({
      success: true,
      message: 'Output Analysis Complete',
      details: {
        ...analysis,
        injectionResults,
        preview: content.substring(0, 500) + '...'
      }
    });
  };

  const downloadContract = () => {
    const contract = (window as any).lastGeneratedContract;
    if (!contract) {
      alert('No contract to download');
      return;
    }
    
    const content = contract.content;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test_contract_${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    log('📥 Contract downloaded');
  };

  const clearLog = () => {
    setTestLog([]);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            🧪 Contract Generator Test Suite
          </h1>
          <p className="text-muted-foreground">
            Comprehensive testing for the MONRH Contract Generator
          </p>
        </div>

        <div className="grid gap-6">
          {/* API Test */}
          <div className="border rounded-lg p-6 bg-card">
            <h2 className="text-xl font-semibold mb-4">Test 1: API Connectivity</h2>
            <button 
              onClick={testAPI}
              disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test API Connection'}
            </button>
            
            {apiResult && (
              <div className={`mt-4 p-4 rounded ${apiResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                <p className="font-semibold">
                  {apiResult.success ? '✅' : '❌'} {apiResult.message}
                </p>
                {apiResult.details && (
                  <div className="mt-2 text-sm">
                    <p>Templates: {apiResult.details.templates}</p>
                    <p>Clauses: {apiResult.details.clauses}</p>
                    <p>Rules: {apiResult.details.rules}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Generation Test */}
          <div className="border rounded-lg p-6 bg-card">
            <h2 className="text-xl font-semibold mb-4">Test 2: Contract Generation</h2>
            <button 
              onClick={testGeneration}
              disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate Test Contract'}
            </button>
            
            {generationResult && (
              <div className={`mt-4 p-4 rounded ${generationResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                <p className="font-semibold">
                  {generationResult.success ? '✅' : '❌'} {generationResult.message}
                </p>
                {generationResult.details && (
                  <div className="mt-2 text-sm">
                    <p>Contract ID: {generationResult.details.id}</p>
                    <p>Content Length: {generationResult.details.contentLength} characters</p>
                    <p>Warnings: {generationResult.details.warnings}</p>
                    <button 
                      onClick={downloadContract}
                      className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                    >
                      📥 Download Contract
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Output Analysis */}
          <div className="border rounded-lg p-6 bg-card">
            <h2 className="text-xl font-semibold mb-4">Test 3: Output Analysis</h2>
            <button 
              onClick={testOutput}
              disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
            >
              Analyze Generated Contract
            </button>
            
            {outputResult && outputResult.success && (
              <div className="mt-4 space-y-4">
                <div className="p-4 rounded bg-green-50 text-green-800">
                  <p className="font-semibold">✅ {outputResult.message}</p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="p-3 bg-muted rounded">
                    <p className="font-medium">Content Length</p>
                    <p className="text-lg">{outputResult.details.totalLength}</p>
                  </div>
                  <div className="p-3 bg-muted rounded">
                    <p className="font-medium">Lines</p>
                    <p className="text-lg">{outputResult.details.lines}</p>
                  </div>
                  <div className="p-3 bg-muted rounded">
                    <p className="font-medium">Variables Injected</p>
                    <p className="text-lg text-green-600">{outputResult.details.variablesInjected}</p>
                  </div>
                  <div className="p-3 bg-muted rounded">
                    <p className="font-medium">Legal Elements</p>
                    <p className="text-lg text-green-600">{outputResult.details.legalElements}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Variable Injection Results:</h4>
                  <div className="bg-muted p-3 rounded text-sm font-mono">
                    {outputResult.details.injectionResults.map((result: string, i: number) => (
                      <div key={i}>{result}</div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Contract Preview (first 500 chars):</h4>
                  <div className="bg-muted p-3 rounded text-sm font-mono whitespace-pre-wrap">
                    {outputResult.details.preview}
                  </div>
                </div>
              </div>
            )}
            
            {outputResult && !outputResult.success && (
              <div className="mt-4 p-4 rounded bg-yellow-50 text-yellow-800">
                <p className="font-semibold">⚠️ {outputResult.message}</p>
              </div>
            )}
          </div>

          {/* Test Log */}
          <div className="border rounded-lg p-6 bg-card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Complete Test Log</h2>
              <button 
                onClick={clearLog}
                className="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80"
              >
                Clear Log
              </button>
            </div>
            <div className="bg-muted p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
              {testLog.length > 0 ? (
                testLog.map((logEntry, i) => (
                  <div key={i}>{logEntry}</div>
                ))
              ) : (
                <div className="text-muted-foreground">No test runs yet. Click the test buttons above to start testing.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
