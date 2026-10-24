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
        isAutoNotified: false
      }
    });
  }

  async markEventAutoNotified(id: string) {
    return prisma.scheduledEvent.update({
      where: { id },
      data: {
        isAutoNotified: true
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
        AND: [
          { email: { not: "" } },
          { isEmailActive: true },
          {
            OR: [
              { status: { in: ["Aktif", "Tidak Aktif"] } },
              {
                AND: [
                  { status: "Alumni" },
                  { isAlumniNotifActive: true }
                ]
              }
            ]
          }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        isEmailActive: true,
        isAlumniNotifActive: true
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
