import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/prisma/prisma-client";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    await prisma.kasTransaksi.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting kas transaksi:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await prisma.kasTransaksi.update({
      where: { id },
      data: {
        tanggal: body.tanggal,
        tipe: body.tipe,
        kategori: body.kategori,
        jumlah: parseInt(body.jumlah, 10),
        deskripsi: body.deskripsi,
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating kas transaksi:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
