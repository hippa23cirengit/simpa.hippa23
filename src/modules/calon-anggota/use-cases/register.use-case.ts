import { ApplicantRepository } from "../repositories/applicant.repository";
import { RegisterApplicantInput, RegisterApplicantSchema } from "../schemas/register.schema";
import { randomUUID } from "crypto";

export class RegisterApplicantUseCase {
  private repository: ApplicantRepository;

  constructor() {
    this.repository = new ApplicantRepository();
  }

  async execute(input: RegisterApplicantInput) {
    // 1. Validasi Input via Zod
    const validated = RegisterApplicantSchema.parse(input);
    
    // 2. Siapkan data default
    const date = new Date().toISOString().split("T")[0]; // Tanggal Pendaftaran: YYYY-MM-DD
    const id = randomUUID(); 

    // 3. Simpan ke Database
    await this.repository.create({
      id,
      name: validated.name,
      contact: validated.contact || null,
      tempatLahir: validated.tempatLahir || null,
      tanggalLahir: validated.tanggalLahir || null,
      alamat: validated.alamat || null,
      rtRw: validated.rtRw || null,
      kelDesa: validated.kelDesa || null,
      kecamatan: validated.kecamatan || null,
      kabKota: validated.kabKota || null,
      pekerjaan: validated.pekerjaan || null,
      status: "Menunggu",
      date
    });

    return { success: true, id };
  }
}
