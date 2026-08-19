import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, endpoint } = body;

    if (!token || !token.trim() || token.trim() === "t0k3n-s3cr3t-fonnt3-c1r3ng1t") {
      return NextResponse.json({
        status: false,
        reason: "Token API belum diisi dengan Token Fonnte asli Anda.",
        device_status: "disconnect"
      });
    }

    if (!endpoint || !endpoint.trim()) {
      return NextResponse.json({
        status: false,
        reason: "URL Endpoint API tidak boleh kosong.",
        device_status: "disconnect"
      });
    }

    // Derive device URL strictly from user's provided endpoint
    let deviceApiUrl = endpoint.trim();
    if (deviceApiUrl.endsWith("/send")) {
      deviceApiUrl = deviceApiUrl.slice(0, -5) + "/device";
    } else if (deviceApiUrl.endsWith("/send/")) {
      deviceApiUrl = deviceApiUrl.slice(0, -6) + "/device";
    } else if (!deviceApiUrl.endsWith("/device")) {
      deviceApiUrl = deviceApiUrl.replace(/\/+$/, "") + "/device";
    }

    let response: Response;
    try {
      response = await fetch(deviceApiUrl, {
        method: "POST",
        headers: {
          Authorization: token.trim(),
        },
      });
    } catch (fetchErr: any) {
      return NextResponse.json({
        status: false,
        reason: `URL/Domain (${deviceApiUrl}) tidak dapat dijangkau: ${fetchErr.cause?.message || fetchErr.message || "Endpoint tidak valid"}`,
        device_status: "disconnect"
      });
    }

    if (!response.ok) {
      return NextResponse.json({
        status: false,
        reason: `Endpoint salah (${deviceApiUrl}) mengembalikan HTTP ${response.status} (${response.statusText}).`,
        device_status: "disconnect"
      });
    }

    let data: any;
    try {
      data = await response.json();
    } catch (e) {
      return NextResponse.json({
        status: false,
        reason: `Endpoint (${deviceApiUrl}) tidak mengembalikan format JSON yang valid.`,
        device_status: "disconnect"
      });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({
      status: false,
      reason: error.message || "Gagal menguji endpoint WA Gateway.",
      device_status: "disconnect"
    });
  }
}
