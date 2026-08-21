import { prisma } from "@/infrastructure/prisma/prisma-client";

export class AuthRepository {
  async findByNpa(npa: string) {
    return prisma.akunLogin.findUnique({
      where: { npa },
      include: {
        anggota: true,
      },
    });
  }

  async updateResetToken(npa: string, token: string, expiry: Date) {
    return prisma.akunLogin.update({
      where: { npa },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry,
      },
    });
  }

  async findByResetToken(token: string) {
    return prisma.akunLogin.findUnique({
      where: { resetToken: token },
      include: {
        anggota: true,
      },
    });
  }

  async updatePasswordAndClearToken(npa: string, passwordHash: string) {
    return prisma.akunLogin.update({
      where: { npa },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
  }
}
