import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ContractValidationEngine } from "@/lib/contracts/validation-engine";
import { ContractTemplateEngine } from "@/lib/contracts/template-engine";
import { getFallbackContractCatalog } from "@/lib/contracts/fallback-catalog";
import { ContractTemplate, type ContractFormData } from "@/lib/contracts/types";
import { syncContractToAvisine } from "@/lib/contracts/salary-sync";

// Error messages that should be translated in the frontend
const ERROR_MESSAGES = {
  MISSING_DATA: "Template ID and contract data are required",
  TEMPLATE_NOT_FOUND: "Template not found",
  VALIDATION_FAILED: "Contract validation failed",
  GENERATION_FAILED: "Failed to generate contract",
} as const;

function generateFallbackContract(templateId: string, contractData: ContractFormData) {
  const catalog = getFallbackContractCatalog();
  const template = catalog.templates.find((item) => item.id === templateId || item.contract_type === templateId);

  if (!template) {
    return NextResponse.json(
      { ok: false, error: `${ERROR_MESSAGES.TEMPLATE_NOT_FOUND}: ${templateId}` },
      { status: 404 },
    );
  }

  const validationEngine = new ContractValidationEngine(catalog.validationRules);
  const validationResult = validationEngine.validate(contractData, template.contract_type);

  if (!validationResult.isValid) {
    return NextResponse.json(
      {
        ok: false,
        error: ERROR_MESSAGES.VALIDATION_FAILED,
        validationErrors: validationResult.errors,
        warnings: validationResult.warnings,
      },
      { status: 400 },
    );
  }

  const finalContractData = validationEngine.applyDefaults(contractData, validationResult.defaults);
  const contractContent = renderFallbackContract(template, finalContractData);

  return NextResponse.json({
    ok: true,
    source: "fallback",
    contract: {
      id: crypto.randomUUID(),
      content: contractContent,
      templateId,
      contractData: finalContractData,
      warnings: validationResult.warnings,
      createdAt: new Date().toISOString(),
    },
  });
}

function renderFallbackContract(template: ContractTemplate, contractData: ContractFormData) {
  const title =
    template.contract_type === "CDI"
      ? "CONTRAT DE TRAVAIL A DUREE INDETERMINEE (CDI)"
      : "CONTRAT DE TRAVAIL A DUREE DETERMINEE (CDD)";
  const body = [...template.sections]
    .sort((a, b) => a.order - b.order)
    .map((section, index) => {
      const content = section.content.replace(/{{(\w+)}}/g, (_, key: keyof ContractFormData) => {
        const value = contractData[key];
        if (Array.isArray(value)) return value.join(", ");
        if (value && typeof value === "object") return "";
        return value === undefined || value === null || value === "" ? "A completer" : String(value);
      });
      return `ARTICLE ${index + 1} - ${section.title.toUpperCase()}\n\n${content}`;
    })
    .join("\n\n------------------------------------------------------------\n\n");

  return `${title}\n\n${body}\n\nDocument genere par SIMPAIE le ${new Date().toLocaleDateString("fr-MA")}.`;
}

export async function POST(request: Request) {
  let templateId = "";
  let contractData: ContractFormData | null = null;

  try {
    const body = await request.json();
    templateId = body.templateId;
    contractData = body.contractData;

    if (!templateId || !contractData) {
      return NextResponse.json(
        { ok: false, error: ERROR_MESSAGES.MISSING_DATA },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();
    const serverSupabase = await createSupabaseServerClient();
    const { data: { user } } = await serverSupabase.auth.getUser();

    // Get template - handle both contract_type and template_id
    const { data: template, error: templateError } = await supabase
      .from("contract_templates")
      .select("*")
      .or(`id.eq.${templateId},contract_type.eq.${templateId}`)
      .eq("is_active", true)
      .single();

    if (templateError || !template) {
      console.error("Template not found:", templateId, templateError);
      return generateFallbackContract(templateId, contractData);
    }

    // Cast template to proper type
    const typedTemplate = template as ContractTemplate;

    // Get clauses
    const { data: clauses, error: clausesError } = await supabase
      .from("contract_clauses")
      .select("*")
      .eq("is_active", true);

    if (clausesError) {
      throw new Error(clausesError.message);
    }

    // Get validation rules
    const { data: rules, error: rulesError } = await supabase
      .from("contract_validation_rules")
      .select("*")
      .eq("is_active", true);

    if (rulesError) {
      throw new Error(rulesError.message);
    }

    // Validate contract data
    const validationEngine = new ContractValidationEngine(rules || []);
    const validationResult = validationEngine.validate(contractData, typedTemplate.contract_type);

    if (!validationResult.isValid) {
      console.error("Validation errors:", validationResult.errors);
      return NextResponse.json({
        ok: false,
        error: ERROR_MESSAGES.VALIDATION_FAILED,
        validationErrors: validationResult.errors,
        warnings: validationResult.warnings
      }, { status: 400 });
    }

    // Apply default values
    const finalContractData = validationEngine.applyDefaults(contractData, validationResult.defaults);

    // Generate contract
    const templateEngine = new ContractTemplateEngine(typedTemplate, clauses || []);
    const contractContent = templateEngine.generateContract(finalContractData);

    // Save generated contract
    const { data: generatedContract, error: saveError } = await supabase
      .from("generated_contracts")
      .insert({
        template_id: templateId,
        user_id: user?.id,
        contract_data: finalContractData,
        rendered_content: contractContent
      } as any)
      .select()
      .single();

    if (saveError) {
      throw new Error(saveError.message);
    }

    // Trigger sync to AVISINE for salary insights (background/asynchronous)
    // We pass the company_id if available in the contract data
    syncContractToAvisine(finalContractData).catch(err => {
      console.error("[MONRH-TO-AVISINE-SYNC] Failed to sync contract data:", err);
    });

    return NextResponse.json({
      ok: true,
      contract: {
        id: (generatedContract as any).id,
        content: contractContent,
        templateId,
        contractData: finalContractData,
        warnings: validationResult.warnings,
        createdAt: (generatedContract as any).created_at
      }
    });

  } catch (error) {
    console.error("Contract generation error:", error);
    if (templateId && contractData) {
      return generateFallbackContract(templateId, contractData);
    }
    return NextResponse.json(
      { ok: false, error: ERROR_MESSAGES.GENERATION_FAILED },
      { status: 500 }
    );
  }
}
