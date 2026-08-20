import { KegiatanRepository } from "../repositories/kegiatan.repository";
import {
  DEFAULT_WA_CONFIG,
  DEFAULT_WA_TEMPLATE_KAJIAN,
  DEFAULT_WA_TEMPLATE_UMUM
} from "@/common/lib/mock-db";

export class QueueNotificationUseCase {
  private repository: KegiatanRepository;

  constructor() {
    this.repository = new KegiatanRepository();
  }

  async execute(eventId: string, isSystemTriggered = false) {
    // 1. Fetch Event
    const event = await this.repository.findEventById(eventId);
    if (!event) {
      return { status: false, reason: "Kegiatan tidak ditemukan." };
    }

    // 2. Validate count
    if (event.notificationCount >= 2) {
      return { status: false, reason: "Batas maksimal pengiriman notifikasi (2 kali) telah tercapai." };
    }

    // 3. Validate time
    const eventTimeMs = new Date(`${event.date}T${event.time}:00+07:00`).getTime();
    const nowMs = Date.now();
    const diffMs = eventTimeMs - nowMs;
    const twoHoursMs = 2 * 60 * 60 * 1000;

    if (diffMs <= 0) {
      return { status: false, reason: "Kegiatan sudah dimulai atau telah selesai." };
    }

    // Manual sending only allowed > 2 hours before start
    if (!isSystemTriggered && diffMs <= twoHoursMs) {
      return { status: false, reason: "Waktu pengiriman manual sudah habis (batas maksimal H-2 jam sebelum kegiatan)." };
    }

    // 4. Load Active Members
    const members = await this.repository.getActiveMembers();
    if (members.length === 0) {
      return { status: false, reason: "Tidak ada anggota aktif dengan nomor WhatsApp terdaftar." };
    }

    // 5. Load Settings and Templates
    const settingsMap = await this.repository.getSystemSettings();
    const templateKajian = settingsMap["simpa_wa_template_kajian"] || DEFAULT_WA_TEMPLATE_KAJIAN;
    const templateUmum = settingsMap["simpa_wa_template_umum"] || DEFAULT_WA_TEMPLATE_UMUM;
    const template = event.type === "kajian" ? templateKajian : templateUmum;

    // Helper for formatting Indonesian dates
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const formatDateIndo = (dateStr: string) => {
      const parts = dateStr.split("-");
      if (parts.length !== 3) return dateStr;
      const d = parseInt(parts[2], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parts[0];
      return `${d} ${months[m]} ${y}`;
    };

    // 6. Generate Queue Items
    const queueItems = members.map((member) => {
      const message = template
        .replace(/\{\{NAMA\}\}/gi, member.name)
        .replace(/\{NAMA\}/gi, member.name)
        .replace(/\{\{KEGIATAN\}\}/gi, event.title)
        .replace(/\{KEGIATAN\}/gi, event.title)
        .replace(/\{\{PEMATERI\}\}/gi, event.speaker || "-")
        .replace(/\{PEMATERI\}/gi, event.speaker || "-")
        .replace(/\{\{TEMA\}\}/gi, event.theme || "-")
        .replace(/\{TEMA\}/gi, event.theme || "-")
        .replace(/\{\{TANGGAL\}\}/gi, formatDateIndo(event.date))
        .replace(/\{TANGGAL\}/gi, formatDateIndo(event.date))
        .replace(/\{\{JAM\}\}/gi, event.time)
        .replace(/\{JAM\}/gi, event.time)
        .replace(/\{\{WAKTU\}\}/gi, event.time)
        .replace(/\{WAKTU\}/gi, event.time)
        .replace(/\{\{LOKASI\}\}/gi, event.location || "-")
        .replace(/\{LOKASI\}/gi, event.location || "-");

      let cleanPhone = (member.whatsapp || "").trim().replace(/[^0-9]/g, "");
      if (cleanPhone.startsWith("0")) {
        cleanPhone = "62" + cleanPhone.slice(1);
      }

      return {
        eventId: event.id,
        to: cleanPhone,
        message: message,
        status: "pending"
      };
    });

    // 7. Save to Queue and Increment Notification Count
    await this.repository.createQueueItems(queueItems);
    await this.repository.incrementNotificationCount(event.id);

    return {
      status: true,
      message: `Berhasil memasukkan ${queueItems.length} pesan ke antrean notifikasi.`,
      notificationCount: event.notificationCount + 1
    };
  }
}
