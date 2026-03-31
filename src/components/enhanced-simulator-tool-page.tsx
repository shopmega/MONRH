'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/components/language-provider';
import { useUserJourney } from '@/lib/context/user-journey-context';
import { detectUserScenario, getRecommendedDocuments, getNextSteps } from '@/lib/context/scenario-detection';
import { addSimulationToJourney } from '@/lib/context/user-journey-context';
import { Button } from '@/components/ui/button';

interface Field {
  key: string;
  label: string;
  type: 'number' | 'date' | 'checkbox' | 'select' | 'text';
  defaultValue?: string | number | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ value: string; label: string }>;
}

// Simple field renderer based on the existing pattern
function SimpleFieldRenderer({ 
  field, 
  value, 
  onChange 
}: { 
  field: Field; 
  value: any; 
  onChange: (value: any) => void;
}) {
  const { t } = useLanguage();

  switch (field.type) {
    case 'number':
      return (
        <input
          type="number"
          id={field.key}
          min={field.min}
          max={field.max}
          step={field.step}
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full p-2 border rounded-md"
          placeholder={field.label}
        />
      );
    
    case 'date':
      return (
        <input
          type="date"
          id={field.key}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-2 border rounded-md"
        />
      );
    
    case 'checkbox':
      return (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={field.key}
            checked={value || false}
            onChange={(e) => onChange(e.target.checked)}
            className="rounded"
          />
          <label htmlFor={field.key} className="text-sm font-medium">
            {field.label}
          </label>
        </div>
      );
    
    case 'select':
      return (
        <select
          id={field.key}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-2 border rounded-md"
        >
          <option value="">{field.label}</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    
    case 'text':
      return (
        <input
          type="text"
          id={field.key}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-2 border rounded-md"
          placeholder={field.label}
        />
      );
    
    default:
      return (
        <input
          type="text"
          id={field.key}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-2 border rounded-md"
          placeholder={field.label}
        />
      );
  }
}

interface EnhancedSimulatorToolPageProps {
  title: string;
  description: string;
  apiPath: string;
  calculatorType: string;
  fields: Field[];
  breakdownLabels?: Record<string, string>;
  units?: Record<string, string>;
}

export function EnhancedSimulatorToolPage({
  title,
  description,
  apiPath,
  calculatorType,
  fields,
  breakdownLabels,
  units,
}: EnhancedSimulatorToolPageProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { context, updateLegalContext, addJourneyEvent } = useUserJourney();
  
  const [values, setValues] = useState<Record<string, any>>(() => {
    const initialValues: Record<string, any> = {};
    fields.forEach(field => {
      if (field.defaultValue !== undefined) {
        initialValues[field.key] = field.defaultValue;
      }
    });
    return initialValues;
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Load pre-filled values from URL params
  useEffect(() => {
    const prefilled: Record<string, any> = {};
    fields.forEach(field => {
      const paramValue = searchParams.get(field.key);
      if (paramValue) {
        prefilled[field.key] = field.type === 'number' ? parseFloat(paramValue) :
                           field.type === 'checkbox' ? paramValue === 'true' :
                           paramValue;
      }
    });
    
    if (Object.keys(prefilled).length > 0) {
      setValues(prev => ({ ...prev, ...prefilled }));
    }
  }, [searchParams, fields]);

  // Detect scenario and update context
  useEffect(() => {
    if (context.journey.length > 0) {
      const lastSimulations = context.journey.filter(event => event.type === 'simulation');
      const currentSimulation = { type: calculatorType, result: values };
      
      const scenario = detectUserScenario(lastSimulations, currentSimulation);
      updateLegalContext({
        currentScenario: scenario.type === 'salary_dispute' ? 'dispute' :
                       scenario.type === 'termination_preparation' ? 'termination' :
                       scenario.type === 'workplace_dispute' ? 'dispute' :
                       scenario.type === 'financial_planning' ? 'planning' :
                       'information',
        urgencyLevel: scenario.urgencyLevel,
      });
      
      setSuggestions(getRecommendedDocuments(scenario));
    }
  }, [calculatorType, context.journey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      addJourneyEvent({
        type: 'navigation',
        data: {
          calculatorType,
          input: values,
        },
        context: 'simulation_started'
      });

      const response = await fetch(apiPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const simulationResult = await response.json();
      
      addSimulationToJourney(calculatorType, simulationResult, values);
      setResult(simulationResult);
      
      router.push(`${window.location.pathname}/result`);
      
    } catch (err) {
      console.error('Simulation error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleValueChange = (key: string, value: unknown) => {
    setValues(prev => ({ ...prev, [key]: value }));
    
    addJourneyEvent({
      type: 'navigation',
      data: {
        field: key,
        value,
        calculatorType,
      },
      context: 'field_updated'
    });
  };

  const handleDocumentSuggestion = (documentId: string) => {
    router.push(`/documents/${documentId}?${new URLSearchParams(values).toString()}`);
  };

  const getScenarioColor = (scenario: string) => {
    switch (scenario) {
      case 'dispute': return 'bg-red-100 border-red-200 text-red-800';
      case 'termination': return 'bg-orange-100 border-orange-200 text-orange-800';
      case 'planning': return 'bg-blue-100 border-blue-200 text-blue-800';
      default: return 'bg-gray-100 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
        
        {context.legal.currentScenario && context.legal.currentScenario !== 'information' && (
          <div className={`p-4 rounded-lg border ${getScenarioColor(context.legal.currentScenario)}`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold">
                  {t(`simulator.scenario.${context.legal.currentScenario}`)}
                </span>
                {context.legal.urgencyLevel && (
                  <span className="ml-2 text-sm font-medium">
                    Urgency: {context.legal.urgencyLevel}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Parameters</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <label htmlFor={field.key} className="text-sm font-medium block">
                {field.label}
              </label>
              <SimpleFieldRenderer
                field={field}
                value={values[field.key]}
                onChange={(value) => handleValueChange(field.key, value)}
              />
            </div>
          ))}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-md">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Calculating...' : 'Calculate'}
          </Button>
        </form>
      </div>

      {suggestions.length > 0 && (
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Recommended Documents</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {suggestions.map((documentId) => (
              <div key={documentId} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">{documentId}</h4>
                  <p className="text-sm text-gray-600">
                    Generate this document based on your calculation
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDocumentSuggestion(documentId)}
                >
                  Open
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {context.legal.currentScenario && context.legal.currentScenario !== 'information' && (
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
          <ol className="space-y-2">
            {getNextSteps({
              type: context.legal.currentScenario === 'dispute' ? 'salary_dispute' :
                     context.legal.currentScenario === 'termination' ? 'termination_preparation' :
                     context.legal.currentScenario === 'planning' ? 'financial_planning' :
                     'information',
              confidence: 0.8,
              indicators: [],
              recommendedActions: [],
              urgencyLevel: context.legal.urgencyLevel || 'low'
            }).map((step, index) => (
              <li key={index} className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </span>
                <span className="text-sm">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
