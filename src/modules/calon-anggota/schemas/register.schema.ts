import { z } from "zod";

export const RegisterApplicantSchema = z.object({
  name: z.string().min(1, "Nama lengkap wajib diisi"),
  contact: z.string().optional(),
  tempatLahir: z.string().optional(),
  tanggalLahir: z.string().optional(),
  alamat: z.string().optional(),
  rtRw: z.string().optional(),
  kelDesa: z.string().optional(),
  kecamatan: z.string().optional(),
  kabKota: z.string().optional(),
  pekerjaan: z.string().optional(),
});

export type RegisterApplicantInput = z.infer<typeof RegisterApplicantSchema>;
