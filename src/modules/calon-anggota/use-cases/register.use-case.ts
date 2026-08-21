import { ApplicantRepository } from "../repositories/applicant.repository";
import { RegisterApplicantInput, RegisterApplicantSchema } from "../schemas/register.schema";

export class RegisterApplicantUseCase {
  private repository: ApplicantRepository;

  constructor() {
    this.repository = new ApplicantRepository();
  }

  async execute(input: RegisterApplicantInput) {
    // 1. Validasi Input via Zod
    const validated = RegisterApplicantSchema.parse(input);
    
    // 2. Siapkan data default & nomor pendaftaran sequential
    const currentYear = new Date().getFullYear();
    const yearStr = String(currentYear);
    const date = new Date().toISOString().split("T")[0]; // Tanggal Pendaftaran: YYYY-MM-DD
    
    // Ambil prefix secara dinamis dari database
    let prefix = "REG";
    try {
      prefix = await this.repository.getPrefix();
    } catch (e) {
      console.error("Gagal mengambil prefix pendaftaran:", e);
    }

    // Hitung sequence
    let count = 0;
    try {
      count = await this.repository.countApplicantsByPrefixAndYear(prefix, yearStr);
    } catch (e) {
      console.error("Gagal menghitung sequence pendaftaran:", e);
    }

    const seq = String(count + 1).padStart(3, "0");
    const id = `${prefix}-${yearStr}-${seq}`;

    // 3. Simpan ke Database
    await this.repository.create({
      id,
      name: validated.name,
      contact: validated.contact || null,
      email: validated.email || null,
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
