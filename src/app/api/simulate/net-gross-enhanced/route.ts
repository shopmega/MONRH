import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { simulateNetGrossEnhanced, netGrossEnhancedInputSchema } from "@/lib/calculators/net-gross-enhanced";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = netGrossEnhancedInputSchema.parse(body);
    
    const result = simulateNetGrossEnhanced(input);
    
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    
    console.error("Net/Gross enhanced calculation error:", error);
    return NextResponse.json(
      { error: "Calculation failed" },
      { status: 500 }
    );
  }
}
