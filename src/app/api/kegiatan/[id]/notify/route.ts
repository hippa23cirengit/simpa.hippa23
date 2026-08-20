import { NextResponse } from "next/server";
import { QueueNotificationUseCase } from "@/modules/kegiatan/use-cases/queue-notification.use-case";

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    if (!id) {
      return NextResponse.json(
        { status: false, reason: "ID kegiatan wajib disertakan." },
        { status: 400 }
      );
    }

    const useCase = new QueueNotificationUseCase();
    const result = await useCase.execute(id);

    if (!result.status) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { status: false, reason: error.message || "Gagal memasukkan notifikasi ke antrean." },
      { status: 500 }
    );
  }
}
