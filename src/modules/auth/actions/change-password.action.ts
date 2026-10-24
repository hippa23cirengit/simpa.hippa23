"use server";

import { ChangePasswordUseCase } from "../use-cases/change-password.use-case";
import { ChangePasswordInput } from "../schemas/change-password.schema";

const changePasswordUseCase = new ChangePasswordUseCase();

export interface ChangePasswordActionResult {
  success: boolean;
  error?: string;
  message?: string;
}

export async function changePasswordAction(
  input: ChangePasswordInput
): Promise<ChangePasswordActionResult> {
  try {
    const result = await changePasswordUseCase.execute(input);
    return {
      success: true,
      message: result.message,
    };
  } catch (error: any) {
    console.error("Change password failed:", error);

    if (error.errors && error.errors.length > 0) {
      return { success: false, error: error.errors[0].message };
    }

    return {
      success: false,
      error: error.message || "Gagal mengubah kata sandi.",
    };
  }
}
