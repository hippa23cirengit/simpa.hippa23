import { NextResponse } from "next/server"
import { EmailService } from "@/modules/auth/services/email.service"

export async function GET() {
  try {
    const smtpUser = process.env.SMTP_USER || ""
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com"
    const isConfigured = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS)

    return NextResponse.json({
      status: true,
      data: {
        isConfigured,
        smtpUser: smtpUser ? smtpUser.replace(/(?<=.{3}).(?=.*@)/g, "*") : "",
        fullSender: smtpUser || "",
        smtpHost
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { status: false, error: error.message || "Gagal memeriksa konfigurasi SMTP" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { toEmail } = body

    if (!toEmail || typeof toEmail !== "string" || !toEmail.includes("@")) {
      return NextResponse.json(
        { status: false, reason: "Format alamat email penerima tidak valid" },
        { status: 400 }
      )
    }

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json(
        { status: false, reason: "Kredensial SMTP (SMTP_USER/SMTP_PASS) belum disetel di server" },
        { status: 500 }
      )
    }

    const emailService = new EmailService()
    await emailService.sendTestEmail(toEmail.trim())

    return NextResponse.json({
      status: true,
      message: `Email uji coba berhasil dikirim ke ${toEmail.trim()}`
    })
  } catch (error: any) {
    console.error("Error sending test email:", error)
    return NextResponse.json(
      { status: false, reason: error.message || "Gagal mengirim email uji coba" },
      { status: 500 }
    )
  }
}
