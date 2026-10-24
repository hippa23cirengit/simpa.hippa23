import { AuthRepository } from "../repositories/auth.repository";
import { LoginSchema, LoginInput } from "../schemas/login.schema";

export class LoginUseCase {
  private repository: AuthRepository;

  constructor() {
    this.repository = new AuthRepository();
  }

  async execute(input: LoginInput) {
    // 1. Validasi input
    const validated = LoginSchema.parse(input);

    // 2. Normalisasi format NPA (jika 6 digit angka tanpa titik, misal 260000 -> 26.0000)
    let normalizedNpa = validated.npa;
    if (/^\d{6}$/.test(normalizedNpa)) {
      normalizedNpa = `${normalizedNpa.slice(0, 2)}.${normalizedNpa.slice(2)}`;
    }

    // 3. Ambil data akun langsung dari Supabase
    const account = await this.repository.findByNpa(normalizedNpa);
    if (!account) {
      throw new Error("NPA tidak terdaftar di database.");
    }

    // 4. Verifikasi kecocokan password
    if (account.passwordHash !== validated.password) {
      throw new Error("Password yang Anda masukkan salah.");
    }

    // 5. Resolusi role secara dinamis berdasarkan Tasykil live
    let resolvedRole = account.role;
    if (account.npa === "26.0000") {
      resolvedRole = "Super Admin";
    } else if (account.linkedAnggotaId) {
      const memberId = account.linkedAnggotaId;
      const { pimharList, bidangList } = await this.repository.getTasykilStructure();

      const pimharRoleMap: Record<string, string> = {
        ketua: "Ketua",
        wakil_ketua: "Wakil Ketua",
        sekretaris: "Sekretaris",
        wakil_sekretaris: "Wakil Sekretaris",
        bendahara: "Bendahara",
        wakil_bendahara: "Wakil Bendahara",
      };

      const matchedPimhar = pimharList.find((p) => p.anggotaId === memberId);
      if (matchedPimhar && matchedPimhar.roleKey in pimharRoleMap) {
        resolvedRole = pimharRoleMap[matchedPimhar.roleKey];
      } else {
        const matchedBidang = bidangList.find((b) =>
          b.members.some((m) => m.anggotaId === memberId)
        );
        if (matchedBidang) {
          resolvedRole = matchedBidang.name;
        } else {
          resolvedRole = "Anggota";
        }
      }
    }

    // 6. Update last login timestamp di Supabase (Real-time & Zero overhead)
    try {
      await this.repository.updateLastLogin(account.npa);
    } catch (err) {
      console.error(`[AUTH] Gagal mengupdate lastLoginAt untuk ${account.npa}:`, err);
    }

    return {
      success: true,
      user: {
        npa: account.npa,
        name: account.name,
        role: resolvedRole,
        linkedAnggotaId: account.linkedAnggotaId,
      },
    };
  }
}
