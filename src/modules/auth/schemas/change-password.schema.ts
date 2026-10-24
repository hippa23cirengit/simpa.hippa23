import { z } from "zod";

export const ChangePasswordSchema = z
  .object({
    npa: z.string().min(1, "NPA wajib diisi").trim(),
    oldPassword: z.string().min(1, "Kata sandi lama wajib diisi").trim(),
    newPassword: z.string().min(6, "Kata sandi baru minimal 6 karakter").trim(),
    confirmPassword: z.string().min(1, "Konfirmasi kata sandi wajib diisi").trim(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi kata sandi baru tidak cocok",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
