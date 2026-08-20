import { NextResponse } from "next/server";
import { sendWhatsAppMessage } from "@/common/lib/whatsapp-service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      target, 
      message, 
      token, 
      endpoint, 
      provider, 
      metaToken, 
      metaPhoneId, 
      metaTemplateName, 
      metaTemplateLanguage, 
      metaParams 
    } = body;

    const result = await sendWhatsAppMessage({
      target,
      message,
      provider,
      token,
      endpoint,
      metaToken,
      metaPhoneId,
      metaTemplateName,
      metaTemplateLanguage,
      metaParams
    });

    if (result.status === false && (
      result.reason === "Nomor penerima wajib diisi." ||
      result.reason === "Meta Access Token dan Phone Number ID wajib diisi." ||
      result.reason === "Endpoint self-hosted gateway wajib diisi." ||
      result.reason === "Token API Fonnte wajib diisi."
    )) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { status: false, reason: error.message || "Gagal mengirim pesan WhatsApp." },
      { status: 500 }
    );
  }
}

