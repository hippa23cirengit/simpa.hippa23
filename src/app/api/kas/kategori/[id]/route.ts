import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/prisma/prisma-client";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    await prisma.kasKategori.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting kas kategori:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
