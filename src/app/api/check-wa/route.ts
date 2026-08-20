import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, endpoint, provider } = body;

    // 1. Self-Hosted / Local Gateway
    if (provider === "self-hosted") {
      if (!endpoint || !endpoint.trim()) {
        return NextResponse.json({
          status: false,
          reason: "URL Endpoint API tidak boleh kosong.",
          device_status: "disconnect"
        });
      }

      let statusUrl = endpoint.trim();
      if (statusUrl.endsWith("/send")) {
        statusUrl = statusUrl.slice(0, -5) + "/status";
      } else if (statusUrl.endsWith("/send/")) {
        statusUrl = statusUrl.slice(0, -6) + "/status";
      } else if (!statusUrl.endsWith("/status")) {
        statusUrl = statusUrl.replace(/\/+$/, "") + "/status";
      }

      try {
        const response = await fetch(statusUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          return NextResponse.json({
            status: false,
            device_status: "disconnect",
            reason: `Gateway Server mengembalikan HTTP ${response.status} (${response.statusText}).`
          });
        }

        const data = await response.json();
        return NextResponse.json({
          status: data.whatsappReady ? true : false,
          device_status: data.whatsappReady ? "connect" : "disconnect",
          device_name: "Self-Hosted Gateway",
          device_number: data.whatsappReady ? "Connected (Ready)" : "Offline (Not Ready)",
          name: "Self-Hosted WA Gateway",
          reason: data.message,
          qr_url: data.qrUrl || null
        });
      } catch (err: any) {
        return NextResponse.json({
          status: false,
          device_status: "disconnect",
          reason: `Gagal menghubungi server gateway (${statusUrl}): ${err.message}`
        });
      }
    }

    // 2. Meta Cloud API
    if (provider === "meta") {
      const { metaToken, metaPhoneId } = body;
      if (!metaToken || !metaPhoneId) {
        return NextResponse.json({
          status: false,
          reason: "Access Token dan Phone Number ID belum lengkap.",
          device_status: "disconnect"
        });
      }

      try {
        const response = await fetch(`https://graph.facebook.com/v20.0/${metaPhoneId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${metaToken.trim()}`
          }
        });

        if (!response.ok) {
          const errData = await response.json();
          return NextResponse.json({
            status: false,
            device_status: "disconnect",
            reason: errData.error?.message || "Kredensial Meta salah atau tidak valid."
          });
        }

        const data = await response.json();
        return NextResponse.json({
          status: true,
          device_status: "connect",
          device_name: data.display_phone_number || "Meta Cloud API",
          device_number: data.id || "Verified",
          name: "Meta Cloud API Platform",
          reason: "Terhubung sukses dengan server Meta Graph API."
        });
      } catch (err: any) {
        return NextResponse.json({
          status: false,
          device_status: "disconnect",
          reason: `Gagal menghubungi server Meta: ${err.message}`
        });
      }
    }

    // 3. Fonnte (Default fallback)
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
