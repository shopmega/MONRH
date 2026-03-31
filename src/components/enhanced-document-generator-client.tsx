'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/components/language-provider';
import { useUserJourney } from '@/lib/context/user-journey-context';
import { Button } from '@/components/ui/button';

interface DocumentTemplate {
  id: string;
  title: string;
  description: string;
  category_slug: string;
  fields: Array<{
    key: string;
    label: string;
    type: string;
    required: boolean;
    defaultValue?: string;
    options?: Array<{ value: string; label: string }>;
  }>;
  content_blocks: Array<{
    type: string;
    content: string;
  }>;
  next_steps: string[];
}

interface EnhancedDocumentGeneratorClientProps {
  template: DocumentTemplate;
  initialValues?: Record<string, any>;
}

// Simple document preview builder (replaces missing import)
function buildDocumentPreview(contentBlocks: any[], values: Record<string, any>) {
  let preview = '';
  
  for (const block of contentBlocks) {
    if (block.type === 'text') {
      let content = block.content;
      // Replace placeholders with actual values
      for (const [key, value] of Object.entries(values)) {
        const placeholder = `{{${key}}}`;
        content = content.replace(new RegExp(placeholder, 'g'), String(value));
      }
      preview += content + '\n\n';
    } else if (block.type === 'heading') {
      preview += `## ${block.content}\n\n`;
    } else if (block.type === 'list') {
      preview += block.content.split('\n').map((item: string) => `- ${item}`).join('\n') + '\n\n';
    }
  }
  
  return preview;
}

function toPreviewText(preview: string): string {
  return preview;
}

export function EnhancedDocumentGeneratorClient({ 
  template, 
  initialValues = {} 
}: EnhancedDocumentGeneratorClientProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { context } = useUserJourney();
  
  const [values, setValues] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    for (const [key, value] of searchParams.entries()) {
      initial[key] = value;
    }
    return { ...initial, ...initialValues };
  });
  
  const [previewText, setPreviewText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Apply smart prefilling from context
  useEffect(() => {
    if (context.lastSimulation) {
      // Simple prefilling - just add salary and basic info
      const prefilledData: Record<string, any> = {};
      
      if (context.lastSimulation.calculatorType === 'net_gross_enhanced') {
        prefilledData.monthly_salary = context.lastSimulation.result.breakdown.grossSalary || context.lastSimulation.result.breakdown.monthlySalary;
        prefilledData.current_salary = context.lastSimulation.result.breakdown.grossSalary || context.lastSimulation.result.breakdown.monthlySalary;
      }
      
      if (context.lastSimulation.calculatorType === 'licenciement_enhanced') {
        prefilledData.monthly_salary = context.lastSimulation.result.breakdown.monthlySalary;
        prefilledData.service_years = context.lastSimulation.result.breakdown.yearsOfService;
        prefilledData.legal_indemnity = context.lastSimulation.result.breakdown.legalIndemnity;
      }
      
      if (Object.keys(prefilledData).length > 0) {
        setValues(prev => ({ ...prev, ...prefilledData }));
      }
    }
  }, [context.lastSimulation, template.id]);

  // Generate document preview
  useEffect(() => {
    try {
      const preview = buildDocumentPreview(template.content_blocks || [], values);
      setPreviewText(toPreviewText(preview));
    } catch (error) {
      console.error('Preview generation error:', error);
    }
  }, [values, template.content_blocks]);

  const handleValueChange = (key: string, value: any) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerateDocument = async () => {
    setIsGenerating(true);
    
    try {
      console.log('Generating document with values:', values);
      setTimeout(() => {
        setIsGenerating(false);
      }, 1000);
    } catch (error) {
      console.error('Document generation error:', error);
      setIsGenerating(false);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(previewText);
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${template.title}</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }
              h1 { color: #333; }
              .content { white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <h1>${template.title}</h1>
            <div class="content">${previewText}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleSaveDocument = async () => {
    try {
      // Save document to user account or localStorage
      const documentData = {
        id: `doc_${Date.now()}`,
        templateId: template.id,
        templateTitle: template.title,
        values,
        previewText,
        createdAt: new Date().toISOString()
      };
      
      // You would typically save this to your backend
      console.log('Saving document:', documentData);
      
      // Add to user journey context
      const { addDocumentDraft } = useUserJourney();
      addDocumentDraft(template.id, documentData);
      
    } catch (error) {
      console.error('Save document error:', error);
    }
  };

  const getRequiredFields = () => {
    return template.fields?.filter(field => field.required).map(field => field.key) || [];
  };

  const getCompletionPercentage = () => {
    const requiredFields = getRequiredFields();
    const completedFields = requiredFields.filter(field => 
      values[field.key] && values[field.key] !== ''
    );
    return requiredFields.length > 0 ? Math.round((completedFields.length / requiredFields.length) * 100) : 0;
  };

  const getMissingFields = () => {
    return template.fields?.filter(field => 
      field.required && (!values[field.key] || values[field.key] === '')
    ).map(field => field.label) || [];
  };

  const isFormValid = () => {
    return getMissingFields().length === 0;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">{template.title}</h1>
        <p className="text-muted-foreground">{template.description}</p>
        
        {context.lastSimulation && context.lastSimulation.type && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">
                  Prérempli depuis: {context.lastSimulation.type}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Remplir le Document</h2>
        <div className="flex items-center space-x-4 mb-4">
          <span className="text-sm text-muted-foreground">
            Complétion: {getCompletionPercentage()}%
          </span>
          {getMissingFields().length > 0 && (
            <span className="text-sm text-red-600">
              Champs manquants: {getMissingFields().join(', ')}
            </span>
          )}
        </div>
        <form className="space-y-6">
          {template.fields?.map((field) => (
            <div key={field.key} className="space-y-2">
              <label htmlFor={field.key} className="text-sm font-medium block">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              
              <input
                type={field.type === 'text' ? 'text' : field.type}
                id={field.key}
                value={values[field.key] || field.defaultValue || ''}
                onChange={(e) => handleValueChange(field.key, e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder={field.defaultValue}
              />
            </div>
          ))}
          
          <div className="flex space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopyToClipboard}
            >
              Copier
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={handlePrint}
            >
              Imprimer
            </Button>
            
            <Button
              type="button"
              onClick={handleSaveDocument}
              disabled={!isFormValid()}
            >
              Sauvegarder
            </Button>
            
            <Button
              type="button"
              onClick={handleGenerateDocument}
              disabled={!isFormValid() || isGenerating}
            >
              {isGenerating ? 'Génération...' : 'Générer le Document'}
            </Button>
          </div>
        </form>
      </div>

      {previewText && (
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Aperçu</h2>
          <div className="bg-gray-50 p-6 border rounded-md">
            <pre className="whitespace-pre-wrap text-sm">{previewText}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
