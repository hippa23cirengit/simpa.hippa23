import { KegiatanRepository } from "../repositories/kegiatan.repository";
import { QueueNotificationUseCase } from "./queue-notification.use-case";
import { sendWhatsAppMessage } from "@/common/lib/whatsapp-service";
import { DEFAULT_WA_CONFIG } from "@/common/lib/mock-db";

export class ProcessQueueUseCase {
  private repository: KegiatanRepository;
  private queueNotificationUseCase: QueueNotificationUseCase;

  constructor() {
    this.repository = new KegiatanRepository();
    this.queueNotificationUseCase = new QueueNotificationUseCase();
  }

  async execute() {
    const logs: any[] = [];
    let autoQueueCount = 0;

    // --- TASK 1: Auto-Queueing (Fail-Safe) ---
    // Get current date in WIB (UTC+7)
    const nowUtc = new Date();
    const wibOffsetMs = 7 * 60 * 60 * 1000;
    const nowWib = new Date(nowUtc.getTime() + wibOffsetMs);
    const todayStr = nowWib.toISOString().split("T")[0]; // YYYY-MM-DD

    // Fetch all events for today with notificationCount = 0
    const pendingEvents = await this.repository.getTodayEventsPendingNotification(todayStr);

    for (const event of pendingEvents) {
      const eventTimeMs = new Date(`${event.date}T${event.time}:00+07:00`).getTime();
      const nowMs = Date.now();
      const diffMs = eventTimeMs - nowMs;
      const twoHoursMs = 2 * 60 * 60 * 1000;

      // If within 2 hours or less, but event has not started yet
      if (diffMs > 0 && diffMs <= twoHoursMs) {
        try {
          const res = await this.queueNotificationUseCase.execute(event.id, true);
          if (res.status) {
            autoQueueCount++;
            logs.push(`[AUTO-QUEUE] Berhasil mengantrekan notifikasi untuk acara: ${event.title}`);
          } else {
            logs.push(`[AUTO-QUEUE] Gagal mengantrekan notifikasi untuk ${event.title}: ${res.reason}`);
          }
        } catch (err: any) {
          logs.push(`[AUTO-QUEUE] Error mengantrekan ${event.title}: ${err.message}`);
        }
      }
    }

    // --- TASK 2: Queue Processor (Process exactly 1 pending message) ---
    const pendingItem = await this.repository.getPendingQueueItem();

    if (pendingItem) {
      // Load WhatsApp configurations from system settings
      const settingsMap = await this.repository.getSystemSettings();
      let waConfig = DEFAULT_WA_CONFIG;
      if (settingsMap["simpa_wa_config"]) {
        try {
          waConfig = JSON.parse(settingsMap["simpa_wa_config"]);
        } catch (e) {}
      }

      const provider = waConfig.provider || "fonnte";
      const token = waConfig.token;
      const endpoint = waConfig.endpoint;
      const metaToken = waConfig.metaToken || "";
      const metaPhoneId = waConfig.metaPhoneId || "";

      // Load event details to decide if we need metadata template (for Meta provider)
      const event = await this.repository.findEventById(pendingItem.eventId);

      // Re-fetch event type to check if it's "kajian" or "umum"
      const isKajian = event?.type === "kajian";

      const sendParams: any = {
        target: pendingItem.to,
        provider: provider,
        token: token,
        endpoint: endpoint,
        metaToken: metaToken,
        metaPhoneId: metaPhoneId
      };

      if (provider === "meta") {
        sendParams.metaTemplateName = isKajian
          ? (waConfig.metaTemplateKajian || "event_kajian")
          : (waConfig.metaTemplateUmum || "event_umum");
        sendParams.metaTemplateLanguage = "id";
        
        // Render helper for meta template params
        // Extract fields from queued message text or mock
        // Since we already stored the full formatted message in message field, 
        // for Meta we need the raw params. We can reconstruct them or pass the message.
        // But for simplicity, we pass metaParams if available.
        // (Usually Fonnte and Self-Hosted are used for Cirengit gateway).
        sendParams.message = pendingItem.message;
      } else {
        sendParams.message = pendingItem.message;
      }

      try {
        console.log(`[QUEUE PROCESSOR] Mengirim ke WA ${pendingItem.to}...`);
        const result = await sendWhatsAppMessage(sendParams);

        if (result.status === true || result.status === "true") {
          await this.repository.updateQueueStatus(pendingItem.id, "sent");
          logs.push(`[SEND] Sukses kirim pesan ke ${pendingItem.to} untuk event ${pendingItem.eventId}`);
        } else {
          const reason = result.reason || result.detail || "Gagal mengirim pesan via Gateway";
          await this.repository.updateQueueStatus(pendingItem.id, "failed", reason);
          logs.push(`[SEND] Gagal kirim ke ${pendingItem.to}: ${reason}`);
        }
      } catch (err: any) {
        await this.repository.updateQueueStatus(pendingItem.id, "failed", err.message);
        logs.push(`[SEND] Error kirim ke ${pendingItem.to}: ${err.message}`);
      }
    } else {
      logs.push("[PROCESS] Antrean kosong. Tidak ada pesan pending.");
    }

    return {
      success: true,
      autoQueueCount,
      processed: pendingItem ? 1 : 0,
      logs
    };
  }
}
