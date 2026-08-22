import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/prisma/prisma-client";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { otp, newPin } = await req.json();

    if (!otp || !newPin) {
      return NextResponse.json({ success: false, error: "OTP dan PIN Baru wajib diisi." }, { status: 400 });
    }

    const kasSetting = await prisma.kasSetting.findUnique({
      where: { id: "default" }
    });

    if (!kasSetting || !kasSetting.otpCode || !kasSetting.otpExpiry) {
      return NextResponse.json(
        { success: false, error: "Sesi OTP tidak valid atau sudah kadaluarsa." },
        { status: 400 }
      );
    }

    // Check expiry
    if (new Date() > kasSetting.otpExpiry) {
      return NextResponse.json(
        { success: false, error: "Kode OTP sudah kadaluarsa." },
        { status: 400 }
      );
    }

    // Check match
    if (kasSetting.otpCode !== otp.trim()) {
      return NextResponse.json(
        { success: false, error: "Kode OTP tidak valid." },
        { status: 400 }
      );
    }

    // OTP valid, update PIN
    const saltRounds = 10;
    const pinHash = await bcrypt.hash(newPin, saltRounds);

    await prisma.kasSetting.update({
      where: { id: "default" },
      data: {
        pinHash,
        otpCode: null,
        otpExpiry: null
      }
    });

    return NextResponse.json({ success: true, message: "PIN berhasil direset." });
  } catch (error: any) {
    console.error("Error resetting PIN via OTP:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}
