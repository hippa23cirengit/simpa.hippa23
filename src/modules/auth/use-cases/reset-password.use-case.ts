import { AuthRepository } from "../repositories/auth.repository";
import { ResetPasswordSchema, ResetPasswordInput } from "../schemas/reset-password.schema";

export class ResetPasswordUseCase {
  private repository: AuthRepository;

  constructor() {
    this.repository = new AuthRepository();
  }

  async execute(input: ResetPasswordInput) {
    // 1. Validate Input
    const validated = ResetPasswordSchema.parse(input);

    // 2. Find and verify token
    const account = await this.repository.findByResetToken(validated.token);
    if (!account) {
      throw new Error("Token reset password tidak valid atau tidak ditemukan.");
    }

    if (!account.resetTokenExpiry || account.resetTokenExpiry < new Date()) {
      throw new Error("Token reset password sudah kedaluwarsa.");
    }

    // 3. Update password and clear token in Supabase
    await this.repository.updatePasswordAndClearToken(account.npa, validated.password);

    return { success: true };
  }
}
