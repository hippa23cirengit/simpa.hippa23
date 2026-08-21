import { PrismaClient } from "@prisma/client";

// In a real application, you might want to inject PrismaClient or use a singleton,
// but for simplicity here we instantiate it.
const prisma = new PrismaClient();

export class ApplicantRepository {
  async create(data: {
    id: string;
    name: string;
    contact?: string | null;
    tempatLahir?: string | null;
    tanggalLahir?: string | null;
    alamat?: string | null;
    rtRw?: string | null;
    kelDesa?: string | null;
    kecamatan?: string | null;
    kabKota?: string | null;
    pekerjaan?: string | null;
    status: string;
    date: string;
  }) {
    return prisma.applicant.create({
      data: data as any
    });
  }
}
