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
        status: "Aktif",
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

  async createQueueItems(items: { eventId: string; to: string; message: string }[]) {
    return prisma.waQueue.createMany({
      data: items
    });
  }

  async getPendingQueueItem() {
    return prisma.waQueue.findFirst({
      where: { status: "pending" },
      orderBy: { createdAt: "asc" }
    });
  }

  async updateQueueStatus(id: string, status: "sent" | "failed", error?: string) {
    return prisma.waQueue.update({
      where: { id },
      data: {
        status,
        sentAt: status === "sent" ? new Date() : null,
        error: error || null
      }
    });
  }

  async getTodayEventsPendingNotification(todayStr: string) {
    return prisma.scheduledEvent.findMany({
      where: {
        date: todayStr,
        notificationCount: 0
      }
    });
  }

  async getQueueProgress(eventId: string) {
    const total = await prisma.waQueue.count({
      where: { eventId }
    });
    const sent = await prisma.waQueue.count({
      where: {
        eventId,
        status: "sent"
      }
    });
    return { total, sent };
  }
}
