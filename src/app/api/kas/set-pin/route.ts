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

    if (kasSetting && kasSetting.pinHash) {
      return NextResponse.json({ success: false, error: "PIN sudah diatur. Gunakan fitur ubah PIN." }, { status: 400 });
    }

    const saltRounds = 10;
    const pinHash = await bcrypt.hash(pin, saltRounds);

    await prisma.kasSetting.upsert({
      where: { id: "default" },
      update: { pinHash },
      create: {
        id: "default",
        saldoAwal: 0,
        pinHash,
      },
    });

    return NextResponse.json({ success: true, message: "PIN berhasil disimpan." });
  } catch (error: any) {
    console.error("Error setting PIN:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { oldPin, newPin } = await req.json();

    if (!oldPin || !newPin) {
      return NextResponse.json({ success: false, error: "PIN Lama dan PIN Baru wajib diisi." }, { status: 400 });
    }

    const kasSetting = await prisma.kasSetting.findUnique({
      where: { id: "default" }
    });

    if (!kasSetting || !kasSetting.pinHash) {
      return NextResponse.json({ success: false, error: "PIN belum diatur." }, { status: 400 });
    }

    const isMatch = await bcrypt.compare(oldPin, kasSetting.pinHash);
    if (!isMatch) {
      return NextResponse.json({ success: false, error: "PIN Lama salah." }, { status: 400 });
    }

    const saltRounds = 10;
    const pinHash = await bcrypt.hash(newPin, saltRounds);

    await prisma.kasSetting.update({
      where: { id: "default" },
      data: { pinHash }
    });

    return NextResponse.json({ success: true, message: "PIN berhasil diubah." });
  } catch (error: any) {
    console.error("Error changing PIN:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}
