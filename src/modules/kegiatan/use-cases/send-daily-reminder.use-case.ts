import { KegiatanRepository } from "../repositories/kegiatan.repository";
import { EmailTemplateParserService } from "../services/email-template-parser.service";
import { EmailService } from "@/modules/auth/services/email.service";
import { DEFAULT_EMAIL_TEMPLATES, EmailTemplateConfig } from "@/common/lib/mock-db";

export class SendDailyReminderUseCase {
  private repository: KegiatanRepository;
  private parser: EmailTemplateParserService;
  private emailService: EmailService;

  constructor() {
    this.repository = new KegiatanRepository();
    this.parser = new EmailTemplateParserService();
    this.emailService = new EmailService();
  }

  async execute() {
    // 1. Tentukan tanggal hari ini dalam zona waktu WIB (UTC+7) format YYYY-MM-DD
    const todayWib = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    // 2. Ambil agenda hari ini yang belum pernah dinotifikasi (notificationCount === 0)
    const pendingEvents = await this.repository.getTodayPendingEvents(todayWib);

    if (pendingEvents.length === 0) {
      return {
        status: true,
        date: todayWib,
        message: `Tidak ada agenda pada hari ini (${todayWib}) yang memerlukan pengingat otomatis.`,
        eventsProcessed: 0,
        totalSent: 0,
      };
    }

    // 3. Ambil anggota aktif yang memiliki email valid
    const members = await this.repository.getActiveMembers();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const recipients = members
      .filter((m) => m.email && emailRegex.test(m.email.trim()))
      .map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email.trim(),
      }));

    if (recipients.length === 0) {
      return {
        status: true,
        date: todayWib,
        message: "Agenda ditemukan, tetapi tidak ada anggota aktif dengan email valid.",
        eventsProcessed: 0,
        totalSent: 0,
      };
    }

    // 4. Ambil template pesan
    const settings = await this.repository.getSystemSettings();
    let templateConfig: EmailTemplateConfig = DEFAULT_EMAIL_TEMPLATES;
    if (settings["simpa_email_templates"]) {
      try {
        templateConfig = JSON.parse(settings["simpa_email_templates"]);
      } catch (e) {
        templateConfig = DEFAULT_EMAIL_TEMPLATES;
      }
    }

    let totalSent = 0;
    const processedEventsDetails: any[] = [];

    // 5. Proses pengiriman per agenda
    for (const event of pendingEvents) {
      let eventSentCount = 0;
      let eventFailedCount = 0;

      for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];
        try {
          const { subject, body } = this.parser.parse(templateConfig, event, recipient);
          await this.emailService.sendNotificationEmail(recipient.email, subject, body);
          eventSentCount++;
          totalSent++;
        } catch (err: any) {
          console.error(`[CRON] Gagal mengirim ke ${recipient.email}:`, err);
          eventFailedCount++;
          // Otomatis nonaktifkan status email anggota di database (bounce protection)
          await this.repository.deactivateMemberEmail(recipient.id);
        }

        // Pacing jeda 500ms
        if (i < recipients.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      // Tandai agenda bahwa pengingat hari-H sudah dikirim secara otomatis
      if (eventSentCount > 0) {
        await this.repository.markEventAutoNotified(event.id);
      }

      processedEventsDetails.push({
        eventId: event.id,
        title: event.title,
        sent: eventSentCount,
        failed: eventFailedCount,
      });
    }

    return {
      status: true,
      date: todayWib,
      message: `Berhasil memproses ${pendingEvents.length} agenda kegiatan hari ini.`,
      eventsProcessed: pendingEvents.length,
      totalSent,
      details: processedEventsDetails,
    };
  }
}
