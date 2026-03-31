import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { simulateLicenciementEnhanced, licenciementEnhancedInputSchema } from "@/lib/calculators/licenciement-enhanced";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = licenciementEnhancedInputSchema.parse(body);
    
    const result = simulateLicenciementEnhanced(input);
    
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    
    console.error("Licenciement enhanced calculation error:", error);
    return NextResponse.json(
      { error: "Calculation failed" },
      { status: 500 }
    );
  }
}
