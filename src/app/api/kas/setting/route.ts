import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/prisma/prisma-client";

export async function GET() {
  try {
    const setting = await prisma.kasSetting.findUnique({
      where: { id: "default" }
    });
    return NextResponse.json(setting || { saldoAwal: 0 });
  } catch (error: any) {
    console.error("Error fetching kas setting:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { saldoAwal } = await req.json();

    if (typeof saldoAwal !== "number") {
      return NextResponse.json({ error: "saldoAwal harus berupa angka" }, { status: 400 });
    }

    const updated = await prisma.kasSetting.upsert({
      where: { id: "default" },
      update: { saldoAwal },
      create: {
        id: "default",
        saldoAwal
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating kas setting:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
