import { TOOL_CATALOG } from "@/lib/tools/tool-catalog";

export function calculatorTypeToPath(calculatorType: string): string | null {
  const match = TOOL_CATALOG.find(
    (tool) => tool.kind === "simulator" && tool.id === calculatorType,
  );
  return match?.href ?? null;
}
