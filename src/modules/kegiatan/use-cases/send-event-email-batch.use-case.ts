import { KegiatanRepository } from "../repositories/kegiatan.repository";
import { EmailTemplateParserService } from "../services/email-template-parser.service";
import { EmailService } from "@/modules/auth/services/email.service";
import { SendEmailBatchInput } from "../schemas/send-email-batch.schema";
import { DEFAULT_EMAIL_TEMPLATES, EmailTemplateConfig } from "@/common/lib/mock-db";

export class SendEventEmailBatchUseCase {
  private repository: KegiatanRepository;
  private parser: EmailTemplateParserService;
  private emailService: EmailService;

  constructor() {
    this.repository = new KegiatanRepository();
    this.parser = new EmailTemplateParserService();
    this.emailService = new EmailService();
  }

  async execute(eventId: string, input: SendEmailBatchInput) {
    const event = await this.repository.findEventById(eventId);
    if (!event) {
      throw new Error("Agenda kegiatan tidak ditemukan");
    }

    const settings = await this.repository.getSystemSettings();
    let templateConfig: EmailTemplateConfig = DEFAULT_EMAIL_TEMPLATES;
    if (settings["simpa_email_templates"]) {
      try {
        templateConfig = JSON.parse(settings["simpa_email_templates"]);
      } catch (e) {
        templateConfig = DEFAULT_EMAIL_TEMPLATES;
      }
    }

    let sentCount = 0;
    let failedCount = 0;
    const errors: { id: string; email: string; error: string }[] = [];

    for (let i = 0; i < input.recipients.length; i++) {
      const recipient = input.recipients[i];
      try {
        const { subject, body } = this.parser.parse(templateConfig, event, recipient);
        await this.emailService.sendNotificationEmail(recipient.email, subject, body);
        sentCount++;
      } catch (err: any) {
        console.error(`Gagal mengirim email ke ${recipient.email}:`, err);
        failedCount++;
        // Otomatis nonaktifkan status email anggota di database (bounce protection)
        await this.repository.deactivateMemberEmail(recipient.id);
        errors.push({
          id: recipient.id,
          email: recipient.email,
          error: `${err.message || "Gagal mengirim email"} (Status email otomatis dinonaktifkan)`,
        });
      }

      // Beri jeda 1 detik antar pengiriman jika masih ada penerima berikutnya dalam batch ini
      if (i < input.recipients.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Jika ini adalah batch terakhir dan setidaknya ada email yang berhasil terkirim
    if (input.isLastBatch && sentCount > 0) {
      await this.repository.incrementNotificationCount(eventId);
    }

    return {
      sentCount,
      failedCount,
      errors,
      isLastBatch: Boolean(input.isLastBatch),
    };
  }
}
