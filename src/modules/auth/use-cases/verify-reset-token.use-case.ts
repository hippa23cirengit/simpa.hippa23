import { AuthRepository } from "../repositories/auth.repository";

export class VerifyResetTokenUseCase {
  private repository: AuthRepository;

  constructor() {
    this.repository = new AuthRepository();
  }

  async execute(token: string) {
    if (!token || token.trim() === "") {
      throw new Error("Token tidak valid.");
    }

    const account = await this.repository.findByResetToken(token);
    if (!account) {
      throw new Error("Token reset password tidak valid atau tidak ditemukan.");
    }

    if (!account.resetTokenExpiry || account.resetTokenExpiry < new Date()) {
      throw new Error("Token reset password sudah kedaluwarsa.");
    }

    return { success: true, name: account.name, npa: account.npa };
  }
}
