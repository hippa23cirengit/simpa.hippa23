import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { status: false, reason: "Endpoint gateway wajib diisi." },
        { status: 400 }
      );
    }

    // Convert endpoint to /restart URL
    let restartUrl = endpoint.trim();
    if (restartUrl.endsWith("/send")) {
      restartUrl = restartUrl.slice(0, -5) + "/restart";
    } else if (restartUrl.endsWith("/send/")) {
      restartUrl = restartUrl.slice(0, -6) + "/restart";
    } else if (!restartUrl.endsWith("/restart")) {
      restartUrl = restartUrl.replace(/\/+$/, "") + "/restart";
    }

    console.log(`Sending restart command to Gateway at ${restartUrl}...`);

    const response = await fetch(restartUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token ? token.trim() : ""
      },
      body: JSON.stringify({ token: token ? token.trim() : "" })
    });

    if (!response.ok) {
      return NextResponse.json({
        status: false,
        reason: `Gateway Server mengembalikan HTTP ${response.status} (${response.statusText}).`
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({
      status: false,
      reason: error.message || "Gagal menghubungi server WA Gateway."
    });
  }
}
