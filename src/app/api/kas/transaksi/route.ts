import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/prisma/prisma-client";

export async function GET() {
  try {
    const transaksi = await prisma.kasTransaksi.findMany({
      orderBy: [
        { tanggal: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    return NextResponse.json(transaksi);
  } catch (error: any) {
    console.error("Error fetching kas transaksi:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { tipe, jumlah, deskripsi, kategori, tanggal } = await req.json();

    if (!tipe || !jumlah || !deskripsi || !kategori || !tanggal) {
      return NextResponse.json({ error: "Semua field harus diisi" }, { status: 400 });
    }

    if (tipe !== "pemasukan" && tipe !== "pengeluaran") {
      return NextResponse.json({ error: "Tipe harus 'pemasukan' atau 'pengeluaran'" }, { status: 400 });
    }

    const newTransaksi = await prisma.kasTransaksi.create({
      data: {
        tipe,
        jumlah: parseInt(jumlah, 10),
        deskripsi,
        kategori,
        tanggal
      }
    });

    return NextResponse.json(newTransaksi);
  } catch (error: any) {
    console.error("Error creating kas transaksi:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
