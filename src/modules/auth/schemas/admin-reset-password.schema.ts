import { z } from "zod";

export const AdminResetPasswordSchema = z.object({
  npa: z.string().min(1, "NPA wajib diisi").trim(),
  newPassword: z.string().min(1, "Password baru wajib diisi").trim(),
});

export type AdminResetPasswordInput = z.infer<typeof AdminResetPasswordSchema>;
