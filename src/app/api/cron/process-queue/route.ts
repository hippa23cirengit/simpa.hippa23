import { NextResponse } from "next/server";
import { ProcessQueueUseCase } from "@/modules/kegiatan/use-cases/process-queue.use-case";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");

    // Secure authorization token check
    if (secret !== "cirengit23-secret-token") {
      return NextResponse.json({ status: false, reason: "Unauthorized" }, { status: 401 });
    }

    const useCase = new ProcessQueueUseCase();
    const result = await useCase.execute();

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { status: false, reason: error.message || "Gagal memproses antrean." },
      { status: 500 }
    );
  }
}
