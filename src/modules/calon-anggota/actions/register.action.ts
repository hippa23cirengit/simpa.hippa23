"use server";

import { RegisterApplicantUseCase } from "../use-cases/register.use-case";
import { RegisterApplicantInput } from "../schemas/register.schema";

const registerApplicantUseCase = new RegisterApplicantUseCase();

export async function registerApplicantAction(input: RegisterApplicantInput) {
  try {
    const result = await registerApplicantUseCase.execute(input);
    return result;
  } catch (error: any) {
    console.error("Failed to register applicant:", error);
    
    // Check for Zod validation errors
    if (error.errors) {
      return { success: false, error: error.errors[0].message };
    }
    
    return { success: false, error: error.message || "Terjadi kesalahan internal" };
  }
}
