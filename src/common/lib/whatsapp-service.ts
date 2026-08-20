export interface SendWhatsAppParams {
  target: string;
  message?: string;
  provider: "fonnte" | "self-hosted" | "meta";
  token?: string;
  endpoint?: string;
  metaToken?: string;
  metaPhoneId?: string;
  metaTemplateName?: string;
  metaTemplateLanguage?: string;
  metaParams?: any[];
}

export async function sendWhatsAppMessage(params: SendWhatsAppParams) {
  const {
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
  } = params;

  if (!target) {
    return { status: false, reason: "Nomor penerima wajib diisi." };
  }

  let cleanTarget = target.trim().replace(/[^0-9]/g, "");
  if (cleanTarget.startsWith("0")) {
    cleanTarget = "62" + cleanTarget.slice(1);
  }

  if (provider === "meta") {
    if (!metaToken || !metaPhoneId) {
      return { status: false, reason: "Meta Access Token dan Phone Number ID wajib diisi." };
    }

    console.log(`Sending Meta Cloud API Message to ${cleanTarget} using template "${metaTemplateName || 'hello_world'}"...`);

    const response = await fetch(`https://graph.facebook.com/v20.0/${metaPhoneId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${metaToken.trim()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: cleanTarget,
        type: "template",
        template: {
          name: metaTemplateName || "hello_world",
          language: {
            code: metaTemplateLanguage || "en_US"
          },
          ...(metaParams && metaParams.length > 0 ? {
            components: [
              {
                type: "body",
                parameters: metaParams.map((p: any) => ({
                  type: "text",
                  text: String(p)
                }))
              }
            ]
          } : {})
        }
      })
    });

    const data = await response.json();
    if (data.error) {
      return {
        status: false,
        reason: data.error.message,
        error: data.error
      };
    }
    
    return {
      status: true,
      response: data
    };
  } else if (provider === "self-hosted") {
    if (!endpoint) {
      return { status: false, reason: "Endpoint self-hosted gateway wajib diisi." };
    }

    console.log(`Sending Message to ${cleanTarget} via Self-Hosted Gateway at ${endpoint}...`);

    const response = await fetch(endpoint.trim(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        to: cleanTarget,
        message: message || "Pesan Uji Coba SIMPA",
        token: token ? token.trim() : ""
      })
    });

    const data = await response.json();
    return data;
  } else {
    // Fonnte
    if (!token) {
      return { status: false, reason: "Token API Fonnte wajib diisi." };
    }

    const urlParams = new URLSearchParams();
    urlParams.append("target", cleanTarget);
    urlParams.append("message", message || "Pesan Uji Coba SIMPA");

    const apiUrl = endpoint || "https://api.fonnte.com/send";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": token.trim(),
      },
      body: urlParams,
    });

    const data = await response.json();
    return data;
  }
}
