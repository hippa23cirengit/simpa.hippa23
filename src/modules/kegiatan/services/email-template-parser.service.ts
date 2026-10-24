import { EmailTemplateConfig, DEFAULT_EMAIL_TEMPLATES } from "@/common/lib/mock-db";

export interface EventData {
  title: string;
  date: string;
  time: string;
  location: string;
  type?: string | null;
  speaker?: string | null;
  theme?: string | null;
}

export interface RecipientData {
  name: string;
  email: string;
}

export class EmailTemplateParserService {
  formatIndonesianDate(dateStr: string): string {
    try {
      const parts = dateStr.split("-").map(Number);
      if (parts.length !== 3) return dateStr;
      const [year, month, day] = parts;
      const date = new Date(year, month - 1, day);
      const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ];
      const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      return `${days[date.getDay()]}, ${day} ${months[month - 1]} ${year}`;
    } catch {
      return dateStr;
    }
  }

  parse(
    templateConfig: EmailTemplateConfig | null | undefined,
    event: EventData,
    recipient: RecipientData
  ): { subject: string; body: string } {
    const config = templateConfig || DEFAULT_EMAIL_TEMPLATES;
    const isKajian = event.type === "kajian";

    const rawSubject = isKajian
      ? config.subjectKajian || DEFAULT_EMAIL_TEMPLATES.subjectKajian
      : config.subjectUmum || DEFAULT_EMAIL_TEMPLATES.subjectUmum;

    const rawBody = isKajian
      ? config.bodyKajian || DEFAULT_EMAIL_TEMPLATES.bodyKajian
      : config.bodyUmum || DEFAULT_EMAIL_TEMPLATES.bodyUmum;

    const formattedDate = this.formatIndonesianDate(event.date);
    const speaker = event.speaker?.trim() || "-";
    const theme = event.theme?.trim() || "-";

    const replaceTags = (text: string): string => {
      return text
        .replace(/{{NAMA}}/gi, recipient.name)
        .replace(/{{KEGIATAN}}/gi, event.title)
        .replace(/{{TEMA}}/gi, theme)
        .replace(/{{PEMATERI}}/gi, speaker)
        .replace(/{{TANGGAL}}/gi, formattedDate)
        .replace(/{{JAM}}/gi, event.time)
        .replace(/{{LOKASI}}/gi, event.location);
    };

    return {
      subject: replaceTags(rawSubject),
      body: replaceTags(rawBody),
    };
  }
}
