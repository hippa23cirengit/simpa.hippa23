import { NextResponse } from "next/server"
import { prisma } from "@/infrastructure/prisma/prisma-client"
import {
  DEFAULT_WA_CONFIG,
  DEFAULT_WA_TEMPLATE_KAJIAN,
  DEFAULT_WA_TEMPLATE_UMUM
} from "@/common/lib/mock-db"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const secret = searchParams.get("secret")

    // Secure authorization token check
    if (secret !== "cirengit23-secret-token") {
      return NextResponse.json({ status: false, reason: "Unauthorized" }, { status: 401 })
    }

    // 1. Fetch WA configurations and templates from Supabase
    const settingsList = await prisma.systemSetting.findMany()
    const settingsMap: Record<string, string> = {}
    settingsList.forEach(s => {
      settingsMap[s.key] = s.value
    })

    let waConfig = DEFAULT_WA_CONFIG
    if (settingsMap["simpa_wa_config"]) {
      try {
        waConfig = JSON.parse(settingsMap["simpa_wa_config"])
      } catch (e) {}
    }

    const templateKajian = settingsMap["simpa_wa_template_kajian"] || DEFAULT_WA_TEMPLATE_KAJIAN
    const templateUmum = settingsMap["simpa_wa_template_umum"] || DEFAULT_WA_TEMPLATE_UMUM

    // 2. Load WA configurations check
    if (!waConfig.token || waConfig.token === "t0k3n-s3cr3t-fonnt3-c1r3ng1t") {
      return NextResponse.json({
        status: false,
        reason: "Fonnte API Token tidak terkonfigurasi di server."
      }, { status: 400 })
    }

    // 3. Load active members list from Supabase
    const dbMembers = await prisma.anggota.findMany({
      where: {
        status: "Aktif"
      }
    })
    const membersWithWa = dbMembers.filter(
      (m) => m.whatsapp && m.whatsapp.trim() !== ""
    )

    if (membersWithWa.length === 0) {
      return NextResponse.json({
        status: "no_active_contacts",
        message: "Tidak ada anggota aktif dengan nomor WhatsApp terdaftar."
      })
    }

    // 4. Get current date in WIB (UTC+7)
    const nowUtc = new Date()
    const wibOffsetMs = 7 * 60 * 60 * 1000
    const nowWib = new Date(nowUtc.getTime() + wibOffsetMs)
    const todayStr = nowWib.toISOString().split("T")[0] // Format YYYY-MM-DD

    // 5. Fetch events from Supabase
    const dbEvents = await prisma.scheduledEvent.findMany()
    const todayEvents = dbEvents.filter((evt) => evt.date === todayStr)

    // Early exit if no events scheduled today
    if (todayEvents.length === 0) {
      return NextResponse.json({
        status: "no_events",
        message: `Tidak ada kegiatan dijadwalkan untuk hari ini (${todayStr}). Supabase Keep-Alive: OK`
      })
    }
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ]
    const formatDateIndo = (dateStr: string) => {
      const parts = dateStr.split("-")
      if (parts.length !== 3) return dateStr
      const d = parseInt(parts[2], 10)
      const m = parseInt(parts[1], 10) - 1
      const y = parts[0]
      return `${d} ${months[m]} ${y}`
    }

    const broadcastLog: any[] = []

    // 5. Send daily event alerts to all registered members
    for (const event of todayEvents) {
      const template = event.type === "kajian" ? templateKajian : templateUmum

      for (const member of membersWithWa) {
        // Build message
        const message = template
          .replace(/\{\{NAMA\}\}/g, member.name)
          .replace(/\{\{KEGIATAN\}\}/g, event.title)
          .replace(/\{\{PEMATERI\}\}/g, event.speaker || "-")
          .replace(/\{\{TEMA\}\}/g, event.theme || "-")
          .replace(/\{\{TANGGAL\}\}/g, formatDateIndo(event.date))
          .replace(/\{\{JAM\}\}/g, event.time)
          .replace(/\{\{LOKASI\}\}/g, event.location || "-")

        // Format recipient phone number
        let cleanPhone = (member.whatsapp || "").trim().replace(/[^0-9]/g, "")
        if (cleanPhone.startsWith("0")) {
          cleanPhone = "62" + cleanPhone.slice(1)
        }

        // Call Fonnte API Gateway via server post
        const params = new URLSearchParams()
        params.append("target", cleanPhone)
        params.append("message", message)

        try {
          const apiRes = await fetch(waConfig.endpoint || "https://api.fonnte.com/send", {
            method: "POST",
            headers: {
              Authorization: waConfig.token.trim()
            },
            body: params
          })

          const resData = await apiRes.json()
          broadcastLog.push({
            member: member.name,
            phone: cleanPhone,
            event: event.title,
            success: resData.status === true || resData.status === "true",
            response: resData
          })
        } catch (err: any) {
          broadcastLog.push({
            member: member.name,
            phone: cleanPhone,
            event: event.title,
            success: false,
            error: err.message
          })
        }
      }
    }

    return NextResponse.json({
      status: "success",
      date: todayStr,
      eventsSentCount: todayEvents.length,
      logs: broadcastLog
    })
  } catch (error: any) {
    return NextResponse.json({ status: false, error: error.message }, { status: 500 })
  }
}
