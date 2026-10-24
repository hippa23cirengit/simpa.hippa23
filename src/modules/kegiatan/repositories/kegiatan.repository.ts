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
        NOT: [
          { whatsapp: null },
          { whatsapp: "" }
        ]
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
