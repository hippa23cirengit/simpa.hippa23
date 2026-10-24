import { NextRequest, NextResponse } from "next/server";
import { GetEventRecipientsUseCase } from "@/modules/kegiatan/use-cases/get-event-recipients.use-case";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { status: false, reason: "ID kegiatan tidak valid" },
        { status: 400 }
      );
    }

    const useCase = new GetEventRecipientsUseCase();
    const result = await useCase.execute(id);

    return NextResponse.json({
      status: true,
      data: result,
    });
  } catch (error: any) {
    console.error("GET /api/kegiatan/[id]/recipients error:", error);
    return NextResponse.json(
      { status: false, reason: error.message || "Gagal mengambil daftar penerima email" },
      { status: error.message?.includes("tidak ditemukan") ? 404 : 500 }
    );
  }
}
