import { prisma } from "@/infrastructure/prisma/prisma-client";

export class KegiatanRepository {
  async findEventById(id: string) {
    return prisma.scheduledEvent.findUnique({
      where: { id }
    });
  }

  async findEventsByDate(dateStr: string) {
    return prisma.scheduledEvent.findMany({
      where: { date: dateStr }
    });
  }

  async getTodayPendingEvents(dateStr: string) {
    return prisma.scheduledEvent.findMany({
      where: {
        date: dateStr,
        notificationCount: 0
      }
    });
  }

  async incrementNotificationCount(id: string) {
    return prisma.scheduledEvent.update({
      where: { id },
      data: {
        notificationCount: {
          increment: 1
        }
      }
    });
  }

  async getActiveMembers() {
    return prisma.anggota.findMany({
      where: {
        OR: [
          { status: "Aktif" },
          { akunLogin: { role: "Super Admin" } }
        ],
        AND: [
          { email: { not: "" } },
          { isEmailActive: true }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        isEmailActive: true
      },
      orderBy: {
        name: "asc"
      }
    });
  }

  async deactivateMemberEmail(memberId: string) {
    try {
      return await prisma.anggota.update({
        where: { id: memberId },
        data: {
          isEmailActive: false
        }
      });
    } catch (error) {
      console.error(`Gagal menonaktifkan email anggota ID ${memberId}:`, error);
      return null;
    }
  }

  async updateMemberEmailStatus(memberId: string, isActive: boolean) {
    return prisma.anggota.update({
      where: { id: memberId },
      data: {
        isEmailActive: isActive
      }
    });
  }

  async getSystemSettings() {
    const settingsList = await prisma.systemSetting.findMany();
    const settingsMap: Record<string, string> = {};
    settingsList.forEach(s => {
      settingsMap[s.key] = s.value;
    });
    return settingsMap;
  }
}
