import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/prisma/prisma-client";
import { EmailService } from "@/modules/auth/services/email.service";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
}

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, error: "Email wajib diisi." }, { status: 400 });
    }

    const otp = generateOTP();
    // 5 minutes from now
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    // Update KasSetting with OTP
    await prisma.kasSetting.upsert({
      where: { id: "default" },
      update: {
        otpCode: otp,
        otpExpiry: expiry
      },
      create: {
        id: "default",
        saldoAwal: 0,
        otpCode: otp,
        otpExpiry: expiry
      },
    });

    // Send Email
    const emailService = new EmailService();
    await emailService.sendPinOtpEmail(email, otp, name || "Pengurus Keuangan");

    // return masked email for UI
    const maskedEmail = email.replace(/(.{2})(.*)(?=@)/, (match: string, p1: string, p2: string) => {
      return p1 + p2.replace(/./g, '*');
    });

    return NextResponse.json({ success: true, email: maskedEmail });
  } catch (error: any) {
    console.error("Error requesting PIN OTP:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan sistem saat mengirim OTP." }, { status: 500 });
  }
}
