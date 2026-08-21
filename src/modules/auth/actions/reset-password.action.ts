"use server";

import { ResetPasswordUseCase } from "../use-cases/reset-password.use-case";
import { ResetPasswordInput } from "../schemas/reset-password.schema";

const resetPasswordUseCase = new ResetPasswordUseCase();

export async function resetPasswordAction(input: ResetPasswordInput): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await resetPasswordUseCase.execute(input);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to reset password:", error);
    
    // Check for Zod validation errors
    if (error.errors) {
      return { success: false, error: error.errors[0].message };
    }
    
    return { success: false, error: error.message || "Terjadi kesalahan internal" };
  }
}
