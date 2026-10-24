import { NextRequest, NextResponse } from "next/server";
import { SendEmailBatchSchema } from "@/modules/kegiatan/schemas/send-email-batch.schema";
import { SendEventEmailBatchUseCase } from "@/modules/kegiatan/use-cases/send-event-email-batch.use-case";

export async function POST(
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

    const body = await req.json();
    const validatedInput = SendEmailBatchSchema.parse(body);

    const useCase = new SendEventEmailBatchUseCase();
    const result = await useCase.execute(id, validatedInput);

    return NextResponse.json({
      status: true,
      data: result,
    });
  } catch (error: any) {
    console.error("POST /api/kegiatan/[id]/send-email-batch error:", error);
    return NextResponse.json(
      { status: false, reason: error.message || "Gagal memproses pengiriman batch email" },
      { status: error.name === "ZodError" ? 400 : 500 }
    );
  }
}
