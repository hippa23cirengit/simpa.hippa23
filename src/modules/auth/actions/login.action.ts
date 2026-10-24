"use server";

import { LoginUseCase } from "../use-cases/login.use-case";
import { LoginInput } from "../schemas/login.schema";

const loginUseCase = new LoginUseCase();

export interface LoginActionResult {
  success: boolean;
  error?: string;
  user?: {
    npa: string;
    name: string;
    role: string;
    linkedAnggotaId: string | null;
  };
}

export async function loginAction(input: LoginInput): Promise<LoginActionResult> {
  try {
    const result = await loginUseCase.execute(input);
    return {
      success: true,
      user: result.user,
    };
  } catch (error: any) {
    console.error("Login verification failed:", error);

    if (error.errors && error.errors.length > 0) {
      return { success: false, error: error.errors[0].message };
    }

    return {
      success: false,
      error: error.message || "Terjadi kesalahan saat verifikasi login.",
    };
  }
}
