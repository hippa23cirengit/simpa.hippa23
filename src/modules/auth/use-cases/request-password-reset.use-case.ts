import { AuthRepository } from "../repositories/auth.repository";
import { EmailService } from "../services/email.service";
import { ForgotPasswordSchema, ForgotPasswordInput } from "../schemas/forgot-password.schema";
import crypto from "crypto";

export class RequestPasswordResetUseCase {
  private repository: AuthRepository;
  private emailService: EmailService;

  constructor() {
    this.repository = new AuthRepository();
    this.emailService = new EmailService();
  }

  async execute(input: ForgotPasswordInput) {
    // 1. Validate Input
    const validated = ForgotPasswordSchema.parse(input);
    const npa = validated.npa.trim();
    const email = validated.email.trim().toLowerCase();

    // 2. Find account
    const account = await this.repository.findByNpa(npa);
    if (!account) {
      throw new Error("NPA atau Email tidak cocok.");
    }

    // 3. Find linked member and check email
    const member = account.anggota;
    if (!member || !member.email || member.email.trim().toLowerCase() !== email) {
      throw new Error("NPA atau Email tidak cocok.");
    }

    // 4. Generate random token and 1-hour expiry
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1); // 1 hour from now

    // 5. Save to database
    await this.repository.updateResetToken(account.npa, token, expiry);

    // 6. Send email
    await this.emailService.sendPasswordResetEmail(member.email, token, account.name);

    return { success: true, email: member.email };
  }
}
