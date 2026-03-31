import type { UserJourneyContext, JourneyEvent } from './user-journey-context';

export interface UserScenario {
  type: 'salary_dispute' | 'termination_preparation' | 'workplace_dispute' | 'financial_planning' | 'information';
  confidence: number;
  indicators: string[];
  recommendedActions: string[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface ScenarioPattern {
  type: UserScenario['type'];
  indicators: string[];
  confidence: number;
  urgencyLevel: UserScenario['urgencyLevel'];
  recommendedActions: string[];
}

// Rule-based scenario patterns
const SCENARIO_PATTERNS: ScenarioPattern[] = [
  {
    type: 'salary_dispute',
    indicators: ['unpaid_salary_recovery', 'overtime', 'smig_compliance', 'unpaid_overtime_recovery'],
    confidence: 0.8,
    urgencyLevel: 'high',
    recommendedActions: [
      'Generate salary recovery letter',
      'File labor inspector complaint',
      'Document unpaid hours',
      'Check SMIG compliance'
    ]
  },
  {
    type: 'termination_preparation',
    indicators: ['licenciement', 'demission', 'fin_cdd', 'duree_preavis'],
    confidence: 0.9,
    urgencyLevel: 'medium',
    recommendedActions: [
      'Generate resignation letter',
      'Calculate notice period',
      'Review indemnities',
      'Prepare final settlement'
    ]
  },
  {
    type: 'workplace_dispute',
    indicators: ['harassment_scenario', 'work_accident', 'probation_termination'],
    confidence: 0.85,
    urgencyLevel: 'critical',
    recommendedActions: [
      'Document evidence',
      'Report to HR',
      'File official complaint',
      'Seek legal consultation'
    ]
  },
  {
    type: 'financial_planning',
    indicators: ['annual_income_tax', 'cnss_pension', 'employer_total_cost', 'net_gross'],
    confidence: 0.7,
    urgencyLevel: 'low',
    recommendedActions: [
      'Optimize tax situation',
      'Plan retirement contributions',
      'Calculate total cost of employment',
      'Review net/gross salary'
    ]
  }
];

export function detectUserScenario(
  simulationHistory: JourneyEvent[],
  currentSimulation: { type: string; result: Record<string, unknown> }
): UserScenario {
  // Get recent simulation types
  const recentSimulations = simulationHistory
    .filter(event => event.type === 'simulation')
    .slice(-5) // Last 5 simulations
    .map(event => event.data.calculatorType as string);

  // Add current simulation
  recentSimulations.push(currentSimulation.type);

  // Calculate pattern matches
  const patternMatches = SCENARIO_PATTERNS.map(pattern => {
    const matchingIndicators = pattern.indicators.filter(indicator => 
      recentSimulations.includes(indicator)
    );
    
    const matchScore = matchingIndicators.length / pattern.indicators.length;
    const confidence = matchScore * pattern.confidence;
    
    return {
      type: pattern.type,
      confidence,
      indicators: matchingIndicators,
      recommendedActions: pattern.recommendedActions,
      urgencyLevel: pattern.urgencyLevel
    };
  });

  // Find best match
  const bestMatch = patternMatches.reduce((best, current) => 
    current.confidence > best.confidence ? current : best
  , patternMatches[0]);

  return bestMatch || {
    type: 'information',
    confidence: 0,
    indicators: [],
    recommendedActions: [],
    urgencyLevel: 'low'
  };
}

export function calculateUrgency(scenario: UserScenario): UserScenario['urgencyLevel'] {
  // Base urgency from scenario
  let urgency = scenario.urgencyLevel;
  
  // Increase urgency based on specific indicators
  if (scenario.indicators.includes('harassment_scenario')) {
    urgency = 'critical';
  }
  
  if (scenario.indicators.includes('unpaid_salary_recovery')) {
    urgency = urgency === 'critical' ? 'critical' : 'high';
  }
  
  return urgency;
}

export function getRecommendedDocuments(scenario: UserScenario): string[] {
  const documentMap: Record<UserScenario['type'], string[]> = {
    salary_dispute: [
      'salary-recovery-letter',
      'overtime-claim-letter',
      'labor-inspector-complaint',
      'smig-compliance-request'
    ],
    termination_preparation: [
      'resignation-letter',
      'notice-letter',
      'final-settlement-request',
      'work-certificate-request'
    ],
    workplace_dispute: [
      'harassment-report-letter',
      'work-accident-declaration',
      'labor-inspector-complaint',
      'evidence-collection-guide'
    ],
    financial_planning: [
      'tax-optimization-request',
      'pension-projection-report',
      'salary-negotiation-letter',
      'employment-cost-analysis'
    ],
    information: [
      'work-certificate-request',
      'salary-verification-request',
      'employment-status-inquiry'
    ]
  };
  
  return documentMap[scenario.type] || [];
}

export function getNextSteps(scenario: UserScenario): string[] {
  const stepMap: Record<UserScenario['type'], string[]> = {
    salary_dispute: [
      'Document all evidence of unpaid amounts',
      'Send formal demand letter to employer',
      'File complaint with labor inspector',
      'Consider legal action if no response'
    ],
    termination_preparation: [
      'Review employment contract terms',
      'Calculate required notice period',
      'Prepare resignation letter',
      'Schedule final settlement meeting'
    ],
    workplace_dispute: [
      'Secure all evidence immediately',
      'Report to HR in writing',
      'File official complaint',
      'Consult legal professional'
    ],
    financial_planning: [
      'Review current tax situation',
      'Analyze retirement needs',
      'Compare employment benefits',
      'Create financial action plan'
    ],
    information: [
      'Gather employment documents',
      'Verify contract details',
      'Understand employee rights',
      'Contact HR for clarification'
    ]
  };
  
  return stepMap[scenario.type] || ['Continue exploring available tools'];
}

export function updateJourneyContext(
  currentContext: UserJourneyContext,
  scenario: UserScenario
): Partial<UserJourneyContext> {
  return {
    legal: {
      ...currentContext.legal,
      currentScenario: scenario.type === 'salary_dispute' ? 'dispute' :
                   scenario.type === 'termination_preparation' ? 'termination' :
                   scenario.type === 'workplace_dispute' ? 'dispute' :
                   scenario.type === 'financial_planning' ? 'planning' :
                   'information',
      urgencyLevel: scenario.urgencyLevel,
      legalReferences: getLegalReferences(scenario),
    },
    journey: [
      ...currentContext.journey,
      {
        id: `scenario_${Date.now()}`,
        type: 'navigation',
        timestamp: new Date().toISOString(),
        data: {
          scenario,
          confidence: scenario.confidence,
          indicators: scenario.indicators
        },
        context: 'scenario_detected'
      }
    ]
  };
}

function getLegalReferences(scenario: UserScenario): string[] {
  const referenceMap: Record<UserScenario['type'], string[]> = {
    salary_dispute: [
      'Article 331-1 du Code du Travail',
      'Dahir n° 1-03-194 du 14 juillet 2004',
      'Article 73 du Code du Travail'
    ],
    termination_preparation: [
      'Article 49 du Code du Travail',
      'Article 51 du Code du Travail',
      'Dahir n° 1-03-194'
    ],
    workplace_dispute: [
      'Article 40 du Code du Travail',
      'Loi n° 103-13 relative à la lutte contre le harcèlement',
      'Article 283 du Code du Travail'
    ],
    financial_planning: [
      'Code Général des Impôts',
      'Article 9 de la loi n° 17-99',
      'Dahir n° 1-72-184'
    ],
    information: [
      'Article 7 du Code du Travail',
      'Article 24 du Code du Travail',
      'Loi n° 65-99'
    ]
  };
  
  return referenceMap[scenario.type] || [];
}
