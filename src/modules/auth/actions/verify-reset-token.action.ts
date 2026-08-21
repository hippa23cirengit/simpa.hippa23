"use server";

import { VerifyResetTokenUseCase } from "../use-cases/verify-reset-token.use-case";

const verifyResetTokenUseCase = new VerifyResetTokenUseCase();

export async function verifyResetTokenAction(token: string): Promise<{ success: boolean; name?: string; npa?: string; error?: string }> {
  try {
    const result = await verifyResetTokenUseCase.execute(token);
    return { success: true, name: result.name, npa: result.npa };
  } catch (error: any) {
    console.error("Failed to verify reset token:", error);
    return { success: false, error: error.message || "Terjadi kesalahan internal" };
  }
}
