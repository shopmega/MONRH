import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";
import { ContractValidationEngine } from "@/lib/contracts/validation-engine";
import { ContractTemplateEngine } from "@/lib/contracts/template-engine";
import { ContractTemplate } from "@/lib/contracts/types";

// Error messages that should be translated in the frontend
const ERROR_MESSAGES = {
  MISSING_DATA: "Template ID and contract data are required",
  TEMPLATE_NOT_FOUND: "Template not found",
  VALIDATION_FAILED: "Contract validation failed",
  GENERATION_FAILED: "Failed to generate contract",
} as const;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { templateId, contractData } = body;

    if (!templateId || !contractData) {
      return NextResponse.json(
        { ok: false, error: ERROR_MESSAGES.MISSING_DATA },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Get template - handle both contract_type and template_id
    const { data: template, error: templateError } = await supabase
      .from("contract_templates")
      .select("*")
      .or(`id.eq.${templateId},contract_type.eq.${templateId}`)
      .eq("is_active", true)
      .single();

    if (templateError || !template) {
      console.error("Template not found:", templateId, templateError);
      return NextResponse.json(
        { ok: false, error: `${ERROR_MESSAGES.TEMPLATE_NOT_FOUND}: ${templateId}` },
        { status: 404 }
      );
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
        contract_data: finalContractData,
        rendered_content: contractContent
      } as any)
      .select()
      .single();

    if (saveError) {
      throw new Error(saveError.message);
    }

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
    return NextResponse.json(
      { ok: false, error: ERROR_MESSAGES.GENERATION_FAILED },
      { status: 500 }
    );
  }
}
