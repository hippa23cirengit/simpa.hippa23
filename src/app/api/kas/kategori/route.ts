import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/prisma/prisma-client";

export async function GET() {
  try {
    const kategori = await prisma.kasKategori.findMany({
      orderBy: { nama: 'asc' }
    });
    return NextResponse.json(kategori);
  } catch (error: any) {
    console.error("Error fetching kas kategori:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { nama, tipe } = await req.json();

    if (!nama || !tipe) {
      return NextResponse.json({ error: "Nama dan tipe diperlukan" }, { status: 400 });
    }

    const newKategori = await prisma.kasKategori.create({
      data: {
        nama,
        tipe
      }
    });

    return NextResponse.json(newKategori);
  } catch (error: any) {
    console.error("Error creating kas kategori:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
