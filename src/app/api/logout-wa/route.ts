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

    // Convert endpoint to /logout URL
    let logoutUrl = endpoint.trim();
    if (logoutUrl.endsWith("/send")) {
      logoutUrl = logoutUrl.slice(0, -5) + "/logout";
    } else if (logoutUrl.endsWith("/send/")) {
      logoutUrl = logoutUrl.slice(0, -6) + "/logout";
    } else if (!logoutUrl.endsWith("/logout")) {
      logoutUrl = logoutUrl.replace(/\/+$/, "") + "/logout";
    }

    console.log(`Sending logout command to Gateway at ${logoutUrl}...`);

    const response = await fetch(logoutUrl, {
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
