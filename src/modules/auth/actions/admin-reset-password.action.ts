"use server";

import { AdminResetPasswordUseCase } from "../use-cases/admin-reset-password.use-case";
import { AdminResetPasswordInput } from "../schemas/admin-reset-password.schema";

const adminResetPasswordUseCase = new AdminResetPasswordUseCase();

export interface AdminResetPasswordActionResult {
  success: boolean;
  error?: string;
  message?: string;
}

export async function adminResetPasswordAction(
  input: AdminResetPasswordInput
): Promise<AdminResetPasswordActionResult> {
  try {
    const result = await adminResetPasswordUseCase.execute(input);
    return {
      success: true,
      message: result.message,
    };
  } catch (error: any) {
    console.error("Admin reset password failed:", error);

    if (error.errors && error.errors.length > 0) {
      return { success: false, error: error.errors[0].message };
    }

    return {
      success: false,
      error: error.message || "Gagal mereset kata sandi pengguna.",
    };
  }
}
