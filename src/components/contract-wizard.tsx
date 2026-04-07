"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useLanguage } from "@/components/language-provider";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { CompanySearchInput, type CompanyOption } from "@/components/company-search-input";
import { SmartDate, SmartAmount, SmartRadioCards, SmartLookup } from "@/components/ui/smart-inputs";
import type { 
  ContractFormData, 
  ContractTemplate, 
  ContractClause, 
  ValidationRule,
  ValidationResult,
  ContractPreview,
  ContractWizardStep,
  FormField
} from "@/lib/contracts/types";
import { ContractValidationEngine } from "@/lib/contracts/validation-engine";
import { ContractTemplateEngine } from "@/lib/contracts/template-engine";

interface ContractWizardProps {
  templates: ContractTemplate[];
  clauses: ContractClause[];
  validationRules: ValidationRule[];
  onPreview?: (preview: ContractPreview) => void;
  onGenerate?: (contractData: ContractFormData) => void;
}

// Local interface removed in favor of Shared interface from types.ts

export function ContractWizard({ 
  templates, 
  clauses, 
  validationRules, 
  onPreview, 
  onGenerate 
}: ContractWizardProps) {
  const { t, language } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ContractFormData>(() => {
    // Load draft from localStorage on initial load
    if (typeof window !== 'undefined') {
      try {
        const savedDraft = localStorage.getItem('contract_draft');
        if (savedDraft) {
          const draft = JSON.parse(savedDraft);
          // Validate draft structure
          if (draft.formData && draft.currentStep !== undefined) {
            return { ...getInitialFormData(), ...draft.formData };
          }
        }
      } catch (error) {
        console.warn('Failed to load contract draft:', error);
      }
    }
    return getInitialFormData();
  });
  const [preview, setPreview] = useState<ContractPreview | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [isAttemptingToProceed, setIsAttemptingToProceed] = useState(false);
  const [isCalculatingNet, setIsCalculatingNet] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showRestoreDraft, setShowRestoreDraft] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<{formData: Partial<ContractFormData>, currentStep: number} | null>(null);

  const validationEngine = useMemo(() => new ContractValidationEngine(validationRules), [validationRules]);
  const templateEngine = useMemo(() => {
    return selectedTemplate ? new ContractTemplateEngine(selectedTemplate, clauses) : null;
  }, [selectedTemplate, clauses]);

  // Live Preview Generator: instantly rebuild document on every stroke
  useEffect(() => {
    if (templateEngine) {
      const timeoutId = setTimeout(() => {
        const requiredFields = validationRules
          .filter(r => r.rule_type === 'required' && (r.contract_type === formData.contract_type || r.contract_type === 'ALL'))
          .map(r => r.field_path);
        const contractPreview = templateEngine.generatePreview(formData, requiredFields);
        setPreview(contractPreview);
        onPreview?.(contractPreview);
      }, 150);
      return () => clearTimeout(timeoutId);
    } else {
      setPreview(null);
    }
  }, [formData, templateEngine, onPreview]);

  // Wizard steps definition
  const wizardSteps: ContractWizardStep[] = [
    {
      id: "contract_type",
      title: t('contractWizard.steps.contractType.title'),
      description: t('contractWizard.steps.contractType.description'),
      fields: [
        {
          id: "contract_type",
          label: t('contractWizard.fields.contractType'),
          type: "select",
          required: true,
          options: [
            { value: "CDI", label: t('contractWizard.options.cdi') },
            { value: "CDD", label: t('contractWizard.options.cdd') }
          ]
        }
      ]
    },
    {
      id: "employer",
      title: t('contractWizard.steps.employer.title'),
      description: t('contractWizard.steps.employer.description'),
      fields: [
        { id: "company_name", label: t('contractWizard.fields.companyName'), type: "company", required: true },
        { id: "company_address", label: t('contractWizard.fields.companyAddress'), type: "textarea", required: true },
        { id: "company_rc", label: t('contractWizard.fields.companyRC'), type: "text", required: true },
        { id: "company_cnss", label: t('contractWizard.fields.companyCNSS'), type: "text", required: true }
      ]
    },
    {
      id: "employee",
      title: t('contractWizard.steps.employee.title'),
      description: t('contractWizard.steps.employee.description'),
      fields: [
        { id: "employee_name", label: t('contractWizard.fields.employeeName'), type: "text", required: true },
        { id: "employee_address", label: t('contractWizard.fields.employeeAddress'), type: "textarea", required: true },
        { id: "employee_cin", label: t('contractWizard.fields.employeeCIN'), type: "text", required: true },
        { id: "employee_cnss", label: t('contractWizard.fields.employeeCNSS'), type: "text" }
      ]
    },
    {
      id: "job",
      title: t('contractWizard.steps.job.title'),
      description: t('contractWizard.steps.job.description'),
      fields: [
        { id: "job_title", label: t('contractWizard.fields.jobTitle'), type: "text", required: true },
        { id: "job_description", label: t('contractWizard.fields.jobDescription'), type: "textarea", required: true },
        { id: "role_level", label: t('contractWizard.fields.roleLevel'), type: "select", required: true,
          options: [
            { value: "employee", label: t('contractWizard.options.employee') },
            { value: "cadre", label: t('contractWizard.options.cadre') }
          ]
        }
      ]
    },
    {
      id: "conditions",
      title: t('contractWizard.steps.conditions.title'),
      description: t('contractWizard.steps.conditions.description'),
      fields: [
        { id: "start_date", label: t('contractWizard.fields.startDate'), type: "date", required: true },
        { id: "contract_duration", label: t('contractWizard.fields.contractDuration'), type: "number", 
          depends_on: { field: "contract_type", value: "CDD" } },
        { id: "end_date", label: t('contractWizard.fields.endDate'), type: "date", 
          depends_on: { field: "contract_type", value: "CDD" } },
        { id: "cdd_justification", label: t('contractWizard.fields.cddJustification'), type: "textarea", 
          depends_on: { field: "contract_type", value: "CDD" } },
        { id: "renewal_times", label: language === "ar" ? "مرات التجديد" : "Nombre de renouvellements", type: "number",
          depends_on: { field: "contract_type", value: "CDD" } },
        { id: "max_duration", label: language === "ar" ? "المدة القصوى (شهور)" : "Durée maximale totale (mois)", type: "number",
          depends_on: { field: "contract_type", value: "CDD" } },
        { id: "trial_period_duration", label: t('contractWizard.fields.trialPeriodDuration'), type: "text" },
        { id: "work_hours", label: t('contractWizard.fields.workHours'), type: "text" },
        { id: "work_days", label: t('contractWizard.fields.workDays'), type: "text" },
        { id: "work_schedule", label: t('contractWizard.fields.workSchedule'), type: "text" }
      ]
    },
    {
      id: "salary",
      title: t('contractWizard.steps.salary.title'),
      description: t('contractWizard.steps.salary.description'),
      fields: [
        { id: "salary_brut", label: t('contractWizard.fields.salaryBrut'), type: "number", required: true },
        { id: "salary_net", label: t('contractWizard.fields.salaryNet'), type: "number" },
        { id: "payment_frequency", label: t('contractWizard.fields.paymentFrequency'), type: "select",
          options: [
            { value: "mensuel", label: t('contractWizard.options.mensuel') },
            { value: "bimensuel", label: t('contractWizard.options.bimensuel') },
            { value: "trimestriel", label: t('contractWizard.options.trimestriel') }
          ]
        },
        { id: "payment_method", label: t('contractWizard.fields.paymentMethod'), type: "select",
          options: [
            { value: "virement", label: t('contractWizard.options.virement') },
            { value: "cheque", label: t('contractWizard.options.cheque') },
            { value: "espece", label: t('contractWizard.options.espece') }
          ]
        }
      ]
    },
    {
      id: "clauses",
      title: t('contractWizard.steps.clauses.title'),
      description: t('contractWizard.steps.clauses.description'),
      fields: []
    },
    {
      id: "final",
      title: t('contractWizard.steps.final.title'),
      description: t('contractWizard.steps.final.description'),
      fields: [
        { id: "contract_location", label: t('contractWizard.fields.contractLocation'), type: "text" },
        { id: "contract_date", label: t('contractWizard.fields.contractDate'), type: "date" }
      ]
    }
  ];

  // Auto-save draft functionality
  const saveDraft = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        const draft = {
          formData,
          currentStep,
          touchedFields: Array.from(touchedFields),
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('contract_draft', JSON.stringify(draft));
        setLastSaved(new Date());
      } catch (error) {
        console.warn('Failed to save contract draft:', error);
      }
    }
  }, [formData, currentStep, touchedFields]);

  // Auto-save when form data changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveDraft();
    }, 1000); // Save after 1 second of inactivity

    return () => clearTimeout(timeoutId);
  }, [formData, currentStep, saveDraft]);

  // Save draft when step changes
  useEffect(() => {
    saveDraft();
  }, [currentStep, saveDraft]);

  // Initial draft detection (don't auto-restore, ask first)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedDraftStr = localStorage.getItem('contract_draft');
        if (savedDraftStr) {
          const draft = JSON.parse(savedDraftStr);
          if (draft.formData && draft.timestamp) {
            // Only show restore if it's recent (e.g., last 24h) or has significant content
            const draftDate = new Date(draft.timestamp);
            const now = new Date();
            const diffHours = (now.getTime() - draftDate.getTime()) / (1000 * 60 * 60);
            
            if (diffHours < 48) {
              setPendingDraft(draft);
              setShowRestoreDraft(true);
            }
          }
        }
      } catch (error) {
        console.warn('Failed to detect contract draft:', error);
      }
    }
  }, []);

  const handleRestoreDraft = () => {
    if (pendingDraft) {
      setFormData(prev => ({ ...prev, ...pendingDraft.formData }));
      setCurrentStep(pendingDraft.currentStep);
      setShowRestoreDraft(false);
      setPendingDraft(null);
    }
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setShowRestoreDraft(false);
    setPendingDraft(null);
  };

  // Initialize form with template selection
  useEffect(() => {
    if (formData.contract_type) {
      const template = templates.find(t => t.contract_type === formData.contract_type);
      setSelectedTemplate(template || null);
    }
  }, [formData.contract_type, templates]);

  // Clear draft when contract is generated
  const clearDraft = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('contract_draft');
        setLastSaved(null);
      } catch (error) {
        console.warn('Failed to clear contract draft:', error);
      }
    }
  };

  // Add draft status indicator and clear functionality
  const handleClearDraft = () => {
    if (confirm(t('contractWizard.deleteDraftConfirm'))) {
      clearDraft();
      // Reset to initial state
      setFormData(getInitialFormData());
      setCurrentStep(0);
      setTouchedFields(new Set());
      setPreview(null);
    }
  };

  // Memoize validation result to avoid redundant calculations
  const validationResult = useMemo(() => {
    if (!selectedTemplate || !formData.contract_type) return null;
    if (touchedFields.size === 0 && !isAttemptingToProceed) return null;
    
    return validationEngine.validate(formData, formData.contract_type);
  }, [formData, formData.contract_type, selectedTemplate, touchedFields.size, isAttemptingToProceed, validationEngine]);

  // Apply defaults when validation rules change or on mount
  useEffect(() => {
    if (validationResult && validationResult.defaults.length > 0) {
      const updatedData = validationEngine.applyDefaults(formData, validationResult.defaults);
      if (JSON.stringify(updatedData) !== JSON.stringify(formData)) {
        setFormData(updatedData);
      }
    }
  }, [validationResult, validationEngine]);

  const handleFieldChange = (field: keyof ContractFormData, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      return updated;
    });
    // Mark field as touched
    setTouchedFields(prev => new Set(prev).add(field));
  };

  const handleCalculateNet = async () => {
    if (!formData.salary_brut) return;
    setIsCalculatingNet(true);
    try {
      const res = await fetch('/api/simulate/net-gross', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          direction: 'gross_to_net',
          amount: formData.salary_brut,
          calculationDate: formData.start_date || new Date().toISOString().split('T')[0]
        })
      });
      const data = await res.json();
      if (data.ok && data.result) {
        handleFieldChange('salary_net', data.result.breakdown.net);
      }
    } catch (e) {
      console.error('Failed to calculate net salary', e);
    } finally {
      setIsCalculatingNet(false);
    }
  };

  const handleCompanySelect = (company: CompanyOption) => {
    setFormData(prev => ({
      ...prev,
      company_name: company.name,
      company_rc: (company as any).rc || '',
      company_cnss: (company as any).cnss || '',
      company_address: (company as any).address || ''
    }));
  };

  const handleClauseToggle = (clauseId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      selected_clauses: checked 
        ? [...(prev.selected_clauses || []), clauseId]
        : prev.selected_clauses?.filter(id => id !== clauseId) || []
    }));
  };

  const handleClauseVariableChange = (clauseId: string, variable: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      clause_variables: {
        ...prev.clause_variables,
        [clauseId]: {
          ...(prev.clause_variables?.[clauseId] as unknown as Record<string, string> || {}),
          [variable]: value
        }
      }
    } as any));
  };

  const nextStep = () => {
    // Set attempting to proceed flag to trigger validation
    setIsAttemptingToProceed(true);
    
    // Check if we can proceed (only block final generation)
    if (!isLastStep || (validationResult?.isValid && touchedFields.size > 0)) {
      if (currentStep < wizardSteps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
    
    // Reset the flag after a short delay
    setTimeout(() => setIsAttemptingToProceed(false), 500);
  };

  const handleGenerate = async () => {
    if (onGenerate) {
      onGenerate(formData);
      // Clear draft after successful generation
      clearDraft();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = wizardSteps[currentStep];
  const isLastStep = currentStep === wizardSteps.length - 1;
  const shouldShowValidation = touchedFields.size > 0 || isAttemptingToProceed;
  // Allow navigation between steps, only block final generation
  const canProceed = !isLastStep || validationResult?.isValid === true;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full max-w-7xl mx-auto">
      {/* Left Column (Wizard Form) */}
      <div className="lg:col-span-7 xl:col-span-8 flex flex-col space-y-6">
      {/* Draft Restoration Banner */}
      {showRestoreDraft && (
        <Alert className="bg-primary/10 border-primary/20 mb-6">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <span className="text-xl">📝</span>
              <div>
                <CardTitle className="text-sm font-bold">Brouillon détecté</CardTitle>
                <CardDescription className="text-xs">
                  Vous avez un contrat en cours commencé le {new Date(pendingDraft?.formData ? (pendingDraft as any).timestamp : Date.now()).toLocaleDateString('fr-FR')}.
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDiscardDraft} className="text-xs">Ignorer</Button>
              <Button onClick={handleRestoreDraft} className="text-xs">Reprendre</Button>
            </div>
          </div>
        </Alert>
      )}

        {/* Draft Status Indicator */}
      {lastSaved && !showRestoreDraft && (
        <div className="flex items-center justify-between bg-muted/50 border rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-muted-foreground">
              {t('contractWizard.draftSaved')}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">
              {lastSaved.toLocaleString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
            </span>
            <Button
              variant="outline"
              onClick={handleClearDraft}
              className="text-xs hover:bg-destructive hover:text-destructive-foreground h-8 px-3"
            >
              {t('contractWizard.deleteDraft')}
            </Button>
          </div>
        </div>
      )}

      {/* Compact Progress Indicator */}
      <div className="mb-6">
        {/* Progress Bar with Step Info */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold text-foreground">
              {t('contractWizard.step')} {currentStep + 1} {t('contractWizard.of')} {wizardSteps.length}
            </h2>
            <span className="text-sm text-muted-foreground">
              {currentStepData.title}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            {Math.round(((currentStep + 1) / wizardSteps.length) * 100)}%
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-1.5 mb-4">
          <div 
            className="bg-primary h-1.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${((currentStep + 1) / wizardSteps.length) * 100}%` }}
          />
        </div>

        {/* Compact Step Indicators */}
        <div className="flex items-center justify-between relative">
          {/* Background Line */}
          <div className="absolute left-0 top-1/2 w-full h-px bg-muted -translate-y-1/2 z-0" />
          
          {wizardSteps.map((step, index) => (
            <div key={step.id} className="relative z-10">
              {/* Step Circle */}
              <div className={`
                w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold
                transition-all duration-300 ease-out border
                ${index < currentStep 
                  ? 'bg-primary border-primary text-primary-foreground' 
                  : index === currentStep 
                    ? 'bg-primary border-primary text-primary-foreground ring-2 ring-primary/30' 
                    : 'bg-background border-muted text-muted-foreground'
                }
              `}>
                {index < currentStep ? (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              
              {/* Tooltip for step names on desktop */}
              <div className="hidden sm:block absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity">
                <div className="bg-popover text-popover-foreground text-xs rounded px-2 py-1 whitespace-nowrap border shadow-sm">
                  {step.title}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Step Names */}
        <div className="sm:hidden mt-2 text-center">
          <div className="text-sm font-medium text-foreground">
            {currentStepData.title}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {currentStep === 0 ? t('contractWizard.inProgress') : currentStep < wizardSteps.length - 1 ? t('contractWizard.step') + ' ' + (currentStep + 1) : t('contractWizard.finalization')}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{currentStepData.title}</CardTitle>
          <CardDescription>{currentStepData.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Validation Errors - only show for current step and after interaction */}
          {shouldShowValidation && validationResult?.errors
            .filter(error => currentStepData.fields.some(field => field.id === error.field))
            .map(error => (
              <Alert key={error.rule_id} variant="destructive">
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            ))}

          {/* Validation Warnings - only show for current step and after interaction */}
          {shouldShowValidation && validationResult?.warnings
            .filter(warning => currentStepData.fields.some(field => field.id === warning.field))
            .map(warning => (
              <Alert key={warning.rule_id}>
                <AlertDescription>{warning.message}</AlertDescription>
              </Alert>
            ))}

          {/* Form Fields */}
          {currentStepData.id === "clauses" ? (
            <ClausesStep
              clauses={clauses}
              selectedClauses={formData.selected_clauses || []}
              clauseVariables={formData.clause_variables as unknown as Record<string, Record<string, string>> || {}}
              onClauseToggle={handleClauseToggle}
              onVariableChange={handleClauseVariableChange}
            />
          ) : (
            <div className="grid gap-4">
              {currentStepData.fields
                .filter(field => !field.depends_on || (formData as any)[field.depends_on.field] === field.depends_on.value)
                .map(field => (
                  <FormField
                    key={field.id}
                    field={field}
                    value={(formData as any)[field.id]}
                    onChange={(value) => handleFieldChange(field.id, value)}
                    onCompanySelect={handleCompanySelect}
                    onCalculateNet={field.id === 'salary_net' ? handleCalculateNet : undefined}
                    isCalculating={field.id === 'salary_net' ? isCalculatingNet : undefined}
                    validation={validationResult ? validationEngine.getFieldValidation(field.id, formData, formData.contract_type) : undefined}
                    touched={touchedFields.has(field.id)}
                  />
                ))}
              </div>
          )}

        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pb-10">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 0}
        >
          {t('contractWizard.previous')}
        </Button>
        
        <div className="flex gap-2">
          {!isLastStep ? (
            <Button onClick={nextStep} disabled={!canProceed}>
              {t('contractWizard.next')}
            </Button>
          ) : (
            <Button 
              onClick={handleGenerate}
              disabled={!preview?.is_complete}
            >
              {t('contractWizard.generate')}
            </Button>
          )}
        </div>
      </div>
    </div>

    {/* Right Column (Live Document Preview) */}
    <div className={`lg:col-span-5 xl:col-span-4 ${isLastStep ? 'block' : 'hidden lg:block'}`}>
      <div className="sticky top-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-md overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 3rem)' }}>
        <div className="px-5 py-4 border-b border-[var(--line)] bg-[var(--surface-muted)] flex justify-between items-center z-10">
          <h3 className="text-sm font-bold text-[var(--foreground)] tracking-tight">
            Aperçu en direct
          </h3>
          {preview && (
            <Badge variant={preview.is_complete ? "default" : "secondary"} className="text-[10px] uppercase font-bold">
              {preview.completion_percentage}% Complété
            </Badge>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-zinc-950">
          {!preview ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4 py-20">
              <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">📄</div>
              <p className="text-sm font-medium text-zinc-500">Commencez à remplir le formulaire<br/>pour générer l'aperçu du contrat.</p>
            </div>
          ) : (
            <div className="space-y-6 font-serif">
              <div className="text-center border-b-2 border-black dark:border-white pb-6 mb-6">
                <div className="text-sm font-bold tracking-[0.2em] mb-1">MONRH</div>
                <div className="text-[10px] text-zinc-500 mb-6 uppercase">Plateforme de Droit du Travail au Maroc</div>
                <div className="text-lg font-bold underline underline-offset-4">
                  {formData.contract_type === 'CDI' ? 'CONTRAT DE TRAVAIL À DURÉE INDÉTERMINÉE (CDI)' : 'CONTRAT DE TRAVAIL À DURÉE DÉTERMINÉE (CDD)'}
                </div>
              </div>
              
              {preview.sections.map(section => (
                <div key={section.id} className="space-y-2">
                  <h4 className="font-bold text-sm underline">{section.title}</h4>
                  <div className="whitespace-pre-wrap text-[11px] leading-relaxed text-justify">
                    {section.content}
                  </div>
                </div>
              ))}
              
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 mt-10 text-center text-[9px] text-zinc-400 leading-relaxed">
                <div>Conforme au Code du Travail Marocain (Loi 65-99)</div>
                <div>Document généré automatiquement par MONRH - {new Date().toLocaleDateString('fr-FR')}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
  );
}

// Form field component with validation
function FormField({ 
  field, 
  value, 
  onChange, 
  onCompanySelect,
  onCalculateNet,
  isCalculating,
  validation,
  touched 
}: {
  field: any;
  value: any;
  onChange: (value: any) => void;
  onCompanySelect?: (company: CompanyOption) => void;
  onCalculateNet?: () => void;
  isCalculating?: boolean;
  validation?: { error?: string; warning?: string };
  touched?: boolean;
}) {
  const { t } = useLanguage();
  const errorMsg = touched ? validation?.error : undefined;
  const hintMsg = touched ? validation?.warning : undefined;

  if (field.type === "company") {
    return (
      <div className="space-y-2">
        <Label htmlFor={field.id}>{field.label} {field.required && "*"}</Label>
        <CompanySearchInput
          value={value || ""}
          onChange={onChange}
          onSelect={onCompanySelect}
        />
        {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}
        {hintMsg && <p className="text-sm text-muted-foreground">{hintMsg}</p>}
      </div>
    );
  }

  if (field.type === "select") {
    if (field.options && field.options.length <= 4) {
      return (
        <SmartRadioCards
          label={field.label}
          value={value || ""}
          onChange={onChange}
          options={field.options}
        />
      );
    } else {
      return (
        <SmartLookup
          label={field.label}
          value={value || ""}
          onChange={onChange}
          options={field.options || []}
          required={field.required}
        />
      );
    }
  }

  if (field.type === "date") {
    return (
      <SmartDate
        label={field.label}
        value={value || ""}
        onChange={onChange}
        required={field.required}
        error={errorMsg}
      />
    );
  }

  if (field.type === "number" || field.id.includes("salary") || field.id.includes("amount")) {
    return (
      <div className="relative">
        {onCalculateNet && (
          <div className="absolute right-0 top-0 z-10 flex justify-end">
            <Button 
              type="button" 
              variant="outline" 
              className="h-6 text-[10px] px-2" 
              onClick={onCalculateNet}
              disabled={isCalculating}
            >
              {isCalculating ? t('loading') : t('nav.simulate')}
            </Button>
          </div>
        )}
        <SmartAmount
          label={field.label}
          value={value || ""}
          onChange={(val) => onChange(Number(val))}
          required={field.required}
          error={errorMsg}
          hint={hintMsg}
        />
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className="space-y-2">
        <Label htmlFor={field.id}>{field.label} {field.required && "*"}</Label>
        <Textarea
          id={field.id}
          value={value || ""}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
          placeholder={field.placeholder}
        />
        {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}
        {hintMsg && <p className="text-sm text-muted-foreground">{hintMsg}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>{field.label} {field.required && "*"}</Label>
      <Input
        id={field.id}
        type={field.type}
        value={value || ""}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder={field.placeholder}
      />
      {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}
      {hintMsg && <p className="text-sm text-muted-foreground">{hintMsg}</p>}
    </div>
  );
}

// Clauses selection step component
function ClausesStep({ 
  clauses, 
  selectedClauses, 
  clauseVariables, 
  onClauseToggle, 
  onVariableChange 
}: {
  clauses: ContractClause[];
  selectedClauses: string[];
  clauseVariables: Record<string, Record<string, string>>;
  onClauseToggle: (clauseId: string, checked: boolean) => void;
  onVariableChange: (clauseId: string, variable: string, value: string) => void;
}) {
  const { t, language } = useLanguage();

  const groupedClauses = clauses.reduce((acc, clause) => {
    if (!acc[clause.category]) {
      acc[clause.category] = [];
    }
    acc[clause.category].push(clause);
    return acc;
  }, {} as Record<string, ContractClause[]>);

  return (
    <div className="space-y-6">
      {clauses.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-2xl opacity-60">
          <p className="text-sm text-muted-foreground">
            {language === 'ar' ? 'لا توجد بنود متاحة حاليا.' : 'Aucune clause particulière disponible pour le moment.'}
          </p>
          <p className="text-xs mt-2">
            Initialisez la base via <code className="bg-muted px-1 rounded">POST /api/contracts/seed</code>
          </p>
        </div>
      ) : (
        Object.entries(groupedClauses).map(([category, categoryClauses]) => (
          <div key={category}>
            <h3 className="font-semibold capitalize mb-3">{category}</h3>
            <div className="space-y-3">
              {categoryClauses.map(clause => {
                const isSelected = selectedClauses.includes(clause.id);
                const variables = extractClauseVariables(clause.content);
                
                return (
                  <Card key={clause.id} className={isSelected ? "border-primary" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id={clause.id}
                          checked={isSelected}
                          onCheckedChange={(checked: boolean) => onClauseToggle(clause.id, checked)}
                        />
                        <div className="flex-1">
                          <Label htmlFor={clause.id} className="font-medium cursor-pointer">
                            {clause.title}
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {clause.content.slice(0, 150)}...
                          </p>
                          
                          {/* Clause variables */}
                          {isSelected && variables.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {variables.map(variable => {
                                const variableLabel = t(`contractWizard.clauseVariables.${variable}`);
                                const labelText = variableLabel.startsWith('contractWizard.clauseVariables') ? variable : variableLabel;
  
                                const numberField = [
                                  'mobility_notice',
                                  'non_competition_duration',
                                  'non_competition_radius',
                                  'non_competition_compensation',
                                  'probation_extension_duration',
                                  'remote_work_days'
                                ].includes(variable);
  
                                const units: Record<string, string> = {
                                  mobility_notice: 'jours',
                                  non_competition_duration: 'mois',
                                  non_competition_radius: 'km',
                                  non_competition_compensation: 'MAD',
                                  probation_extension_duration: 'jours',
                                  remote_work_days: 'jours/semaine'
                                };
  
                                const renderedLabel = labelText.includes('(')
                                  ? labelText
                                  : units[variable] ? `${labelText} (${units[variable]})` : labelText;
  
                                return (
                                  <div key={variable} className="flex items-center space-x-2">
                                    <Label className="text-sm min-w-24">{renderedLabel}:</Label>
                                    <Input
                                      type={numberField ? 'number' : 'text'}
                                      placeholder={t('contractWizard.enterVariable', { variable: labelText })}
                                      value={clauseVariables[clause.id]?.[variable] || ""}
                                      onChange={(e) => onVariableChange(clause.id, variable, e.target.value)}
                                      className="h-8"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// Helper function to get initial form data
function getInitialFormData(): ContractFormData {
  return {
    employee_name: "",
    employee_address: "",
    employee_cin: "",
    employee_cnss: "",
    company_name: "",
    company_address: "",
    company_rc: "",
    company_cnss: "",
    job_title: "",
    job_description: "",
    role_level: "employee",
    contract_type: "CDI",
    start_date: "",
    trial_period_duration: "",
    salary_brut: 0,
    payment_frequency: "mensuel",
    payment_method: "virement",
    work_hours: "44",
    work_days: "6",
    work_schedule: "",
    annual_leave_days: "18",
    selected_clauses: [],
    clause_variables: {},
    renewal_times: "1",
    max_duration: "24",
    notice_period_employee: "15",
    contract_location: "Casablanca",
    contract_date: new Date().toISOString().split('T')[0]
  };
}

// Helper function to extract variables from clause content
function extractClauseVariables(content: string): string[] {
  const variablePattern = /\{\{(\w+)\}\}/g;
  const variables = new Set<string>();
  
  let match;
  while ((match = variablePattern.exec(content)) !== null) {
    variables.add(match[1]);
  }

  return Array.from(variables);
}
