import { z } from "zod";

export const RecipientItemSchema = z.object({
  id: z.string().min(1, "ID anggota wajib diisi"),
  name: z.string().min(1, "Nama anggota wajib diisi"),
  email: z.string().email("Format email tidak valid"),
});

export const SendEmailBatchSchema = z.object({
  recipients: z.array(RecipientItemSchema).min(1, "Daftar penerima minimal 1 orang").max(20, "Maksimal 20 orang per batch"),
  isLastBatch: z.boolean().optional().default(false),
});

export type RecipientItem = z.infer<typeof RecipientItemSchema>;
export type SendEmailBatchInput = z.infer<typeof SendEmailBatchSchema>;
