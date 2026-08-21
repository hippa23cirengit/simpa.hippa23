import { z } from "zod";

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Token tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  confirmPassword: z.string().min(6, "Konfirmasi password minimal 6 karakter"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Konfirmasi password tidak cocok",
  path: ["confirmPassword"],
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
