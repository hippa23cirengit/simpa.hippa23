import { NextRequest, NextResponse } from "next/server";
import { SendDailyReminderUseCase } from "@/modules/kegiatan/use-cases/send-daily-reminder.use-case";

export async function GET(req: NextRequest) {
  return handleCron(req);
}

export async function POST(req: NextRequest) {
  return handleCron(req);
}

async function handleCron(req: NextRequest) {
  try {
    // 1. Verifikasi keamanan CRON_SECRET jika disetel di environment
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { status: false, reason: "Unauthorized: Token CRON_SECRET tidak valid" },
        { status: 401 }
      );
    }

    // 2. Eksekusi pengingat harian
    const useCase = new SendDailyReminderUseCase();
    const result = await useCase.execute();

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("CRON /api/cron/daily-reminder error:", error);
    return NextResponse.json(
      { status: false, reason: error.message || "Gagal memproses cron pengingat harian" },
      { status: 500 }
    );
  }
}
