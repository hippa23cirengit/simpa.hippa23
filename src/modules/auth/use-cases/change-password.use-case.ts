import { AuthRepository } from "../repositories/auth.repository";
import { ChangePasswordSchema, ChangePasswordInput } from "../schemas/change-password.schema";

export class ChangePasswordUseCase {
  private repository: AuthRepository;

  constructor() {
    this.repository = new AuthRepository();
  }

  async execute(input: ChangePasswordInput) {
    // 1. Validasi input
    const validated = ChangePasswordSchema.parse(input);

    // 2. Normalisasi format NPA jika perlu
    let normalizedNpa = validated.npa;
    if (/^\d{6}$/.test(normalizedNpa)) {
      normalizedNpa = `${normalizedNpa.slice(0, 2)}.${normalizedNpa.slice(2)}`;
    }

    // 3. Cari akun di database
    const account = await this.repository.findByNpa(normalizedNpa);
    if (!account) {
      throw new Error("Akun pengguna tidak ditemukan di database.");
    }

    // 4. Verifikasi kata sandi lama
    if (account.passwordHash !== validated.oldPassword) {
      throw new Error("Kata sandi lama yang Anda masukkan salah.");
    }

    // 5. Perbarui kata sandi langsung ke Supabase
    await this.repository.updatePasswordDirect(account.npa, validated.newPassword);

    return {
      success: true,
      message: "Kata sandi Anda berhasil diperbarui di database!",
    };
  }
}
