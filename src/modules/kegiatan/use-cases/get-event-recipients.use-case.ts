import { KegiatanRepository } from "../repositories/kegiatan.repository";

export class GetEventRecipientsUseCase {
  private repository: KegiatanRepository;

  constructor() {
    this.repository = new KegiatanRepository();
  }

  async execute(eventId: string) {
    const event = await this.repository.findEventById(eventId);
    if (!event) {
      throw new Error("Agenda kegiatan tidak ditemukan");
    }

    const members = await this.repository.getActiveMembers();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const recipients = members
      .filter((m) => m.email && emailRegex.test(m.email.trim()))
      .map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email.trim(),
      }));

    return {
      event: {
        id: event.id,
        title: event.title,
        date: event.date,
        time: event.time,
        location: event.location,
        type: event.type,
        speaker: event.speaker,
        theme: event.theme,
        notificationCount: event.notificationCount || 0,
      },
      recipients,
      totalEligible: recipients.length,
    };
  }
}
