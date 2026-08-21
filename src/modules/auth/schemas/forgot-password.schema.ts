import { z } from "zod";

export const ForgotPasswordSchema = z.object({
  npa: z.string().min(1, "NPA wajib diisi"),
  email: z.string().email("Format email tidak valid").min(1, "Email wajib diisi"),
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
