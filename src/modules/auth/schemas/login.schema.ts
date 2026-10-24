import { z } from "zod";

export const LoginSchema = z.object({
  npa: z.string().min(1, "NPA wajib diisi").trim(),
  password: z.string().min(1, "Password wajib diisi").trim(),
});

export type LoginInput = z.infer<typeof LoginSchema>;
