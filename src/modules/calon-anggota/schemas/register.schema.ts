import { z } from "zod";

export const RegisterApplicantSchema = z.object({
  name: z.string().min(1, "Nama lengkap wajib diisi"),
  contact: z.string().min(1, "No. WhatsApp wajib diisi"),
  tempatLahir: z.string().optional(),
  tanggalLahir: z.string().optional(),
  alamat: z.string().optional(),
  pekerjaan: z.string().optional(),
});

export type RegisterApplicantInput = z.infer<typeof RegisterApplicantSchema>;
