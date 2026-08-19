import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { target, message, token, endpoint } = body;

    if (!target || !token) {
      return NextResponse.json(
        { status: false, reason: "Nomor penerima dan Token API Fonnte wajib diisi." },
        { status: 400 }
      );
    }

    let cleanTarget = target.trim().replace(/[^0-9]/g, "");
    if (cleanTarget.startsWith("0")) {
      cleanTarget = "62" + cleanTarget.slice(1);
    }

    const formData = new FormData();
    formData.append("target", cleanTarget);
    formData.append("message", message || "Pesan Uji Coba SIMPA");

    const apiUrl = endpoint || "https://api.fonnte.com/send";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: token.trim(),
      },
      body: formData,
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { status: false, reason: error.message || "Gagal menghubungi server Fonnte WA Gateway." },
      { status: 500 }
    );
  }
}
