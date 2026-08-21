import { prisma } from "@/infrastructure/prisma/prisma-client";

export class ApplicantRepository {
  async getPrefix(): Promise<string> {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "simpa_reg_prefix" }
    });
    return setting?.value || "REG";
  }

  async countApplicantsByPrefixAndYear(prefix: string, year: string): Promise<number> {
    return prisma.applicant.count({
      where: {
        id: {
          startsWith: `${prefix}-${year}-`
        }
      }
    });
  }

  async create(data: {
    id: string;
    name: string;
    contact?: string | null;
    email?: string | null;
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
