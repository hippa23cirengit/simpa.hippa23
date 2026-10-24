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

  async updatePasswordDirect(npa: string, passwordHash: string) {
    return prisma.akunLogin.update({
      where: { npa },
      data: {
        passwordHash,
      },
    });
  }

  async getTasykilStructure() {
    const pimharList = await prisma.pimhar.findMany();
    const bidangList = await prisma.bidang.findMany({
      include: {
        members: true,
      },
    });
    return { pimharList, bidangList };
  }

  async updateLastLogin(npa: string, date: Date = new Date()) {
    return prisma.akunLogin.update({
      where: { npa },
      data: {
        lastLoginAt: date,
      },
    });
  }

  async getRecentLogins(limit: number = 5) {
    const records = await prisma.akunLogin.findMany({
      where: {
        lastLoginAt: {
          not: null,
        },
      },
      orderBy: {
        lastLoginAt: "desc",
      },
      take: limit,
      select: {
        npa: true,
        name: true,
        role: true,
        lastLoginAt: true,
      },
    });

    return records.map((r) => ({
      npa: r.npa,
      name: r.name,
      role: r.role,
      timestamp: r.lastLoginAt ? new Date(r.lastLoginAt).getTime() : Date.now(),
    }));
  }
}
