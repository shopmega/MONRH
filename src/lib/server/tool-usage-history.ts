import { addSimulation } from "@/lib/server/app-store";
import { getCurrentUserId } from "@/lib/server/user-session";

export async function recordToolUsage(
  calculatorType: string,
  input: Record<string, unknown>,
  result: Record<string, unknown>,
): Promise<void> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return;

    await addSimulation(
      {
        calculatorType,
        input,
        result,
      },
      userId,
    );
  } catch {
    // History recording must never block tool responses.
  }
}
