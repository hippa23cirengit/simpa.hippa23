import { AuthRepository } from "../repositories/auth.repository";
import {
  AdminResetPasswordSchema,
  AdminResetPasswordInput,
} from "../schemas/admin-reset-password.schema";

export class AdminResetPasswordUseCase {
  private repository: AuthRepository;

  constructor() {
    this.repository = new AuthRepository();
  }

  async execute(input: AdminResetPasswordInput) {
    const validated = AdminResetPasswordSchema.parse(input);

    let normalizedNpa = validated.npa;
    if (/^\d{6}$/.test(normalizedNpa)) {
      normalizedNpa = `${normalizedNpa.slice(0, 2)}.${normalizedNpa.slice(2)}`;
    }

    const account = await this.repository.findByNpa(normalizedNpa);
    if (!account) {
      throw new Error("Akun pengguna tidak ditemukan di database.");
    }

    await this.repository.updatePasswordDirect(account.npa, validated.newPassword);

    return {
      success: true,
      message: `Password untuk akun ${account.name} (${account.npa}) berhasil diperbarui di database.`,
    };
  }
}
