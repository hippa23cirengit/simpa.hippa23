"use server";

import { RequestPasswordResetUseCase } from "../use-cases/request-password-reset.use-case";
import { ForgotPasswordInput } from "../schemas/forgot-password.schema";

const requestPasswordResetUseCase = new RequestPasswordResetUseCase();

export async function forgotPasswordAction(input: ForgotPasswordInput): Promise<{ success: boolean; email?: string; error?: string }> {
  try {
    const result = await requestPasswordResetUseCase.execute(input);
    return { success: true, email: result.email };
  } catch (error: any) {
    console.error("Failed to request password reset:", error);
    
    // Check for Zod validation errors
    if (error.errors) {
      return { success: false, error: error.errors[0].message };
    }
    
    return { success: false, error: error.message || "Terjadi kesalahan internal" };
  }
}
