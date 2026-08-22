import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/prisma/prisma-client";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { pin } = await req.json();

    if (!pin) {
      return NextResponse.json({ success: false, error: "PIN wajib diisi." }, { status: 400 });
    }

    const kasSetting = await prisma.kasSetting.findUnique({
      where: { id: "default" }
    });

    if (!kasSetting || !kasSetting.pinHash) {
      return NextResponse.json(
        { success: false, error: "PIN belum diatur oleh admin. Silakan atur PIN terlebih dahulu." },
        { status: 400 }
      );
    }

    const isMatch = await bcrypt.compare(pin, kasSetting.pinHash);

    if (isMatch) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: "PIN salah." }, { status: 401 });
    }
  } catch (error: any) {
    console.error("Error verifying PIN:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}
