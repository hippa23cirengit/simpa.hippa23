import { NextResponse } from "next/server";
import { EmailService } from "@/modules/auth/services/email.service";

export async function POST(request: Request) {
  try {
    const { email, name, npa, pass } = await request.json();

    if (!email || !name || !npa || !pass) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const emailService = new EmailService();
    await emailService.sendWelcomeEmail(email, name, npa, pass);

    return NextResponse.json({ success: true, message: "Email sent successfully" });
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send email", error: error.message },
      { status: 500 }
    );
  }
}
