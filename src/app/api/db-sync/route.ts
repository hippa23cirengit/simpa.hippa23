import { NextResponse } from "next/server"
import { prisma } from "@/infrastructure/prisma/prisma-client"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    // 1. Fetch tables from Supabase via Prisma
    const dbAnggota = await prisma.anggota.findMany()
    const dbAkun = await prisma.akunLogin.findMany()
    const dbEvent = await prisma.scheduledEvent.findMany()
    const dbAcl = await prisma.roleAkses.findMany()
    const dbTemplate = await prisma.waTemplate.findFirst()
    const dbPenasehat = await prisma.penasehat.findMany({ orderBy: { sortOrder: "asc" } })
    const dbPimhar = await prisma.pimhar.findMany()
    const dbBidang = await prisma.bidang.findMany({
      include: {
        members: true
      }
    })
    const dbApplicants = await prisma.applicant.findMany()

    // 2. Self-healing / Seeding: If the Supabase database is completely empty, populate it using db.json
    if (dbAnggota.length === 0) {
      console.log("Supabase database is empty. Auto-seeding from local db.json file...")
      const seedFilePath = path.join(process.cwd(), "src/common/lib/db.json")
      
      if (fs.existsSync(seedFilePath)) {
        try {
          const fileContent = fs.readFileSync(seedFilePath, "utf8")
          const seedData = JSON.parse(fileContent)

          // Seed RoleAkses
          if (seedData.simpa_acl_rules) {
            for (const r of seedData.simpa_acl_rules) {
              await prisma.roleAkses.upsert({
                where: { roleName: r.role },
                update: {},
                create: {
                  roleName: r.role,
                  allowDashboard: typeof r.permissions.dashboard !== "undefined" ? r.permissions.dashboard : r.permissions.allowDashboard,
                  viewDataAnggota: r.permissions.viewDataAnggota,
                  manageDataAnggota: r.permissions.manageDataAnggota,
                  viewTasykil: r.permissions.viewTasykil,
                  manageTasykil: r.permissions.manageTasykil,
                  viewCalonAnggota: r.permissions.viewCalonAnggota,
                  manageCalonAnggota: r.permissions.manageCalonAnggota,
                  viewJadwalKegiatan: r.permissions.viewJadwalKegiatan,
                  manageJadwalKegiatan: r.permissions.manageJadwalKegiatan,
                  viewPengaturan: r.permissions.viewPengaturan,
                  managePengaturan: r.permissions.managePengaturan
                }
              })
            }
          }

          // Seed Anggota
          if (seedData.simpa_members_state) {
            for (const m of seedData.simpa_members_state) {
              await prisma.anggota.upsert({
                where: { id: m.id },
                update: {},
                create: {
                  id: m.id,
                  name: m.name,
                  status: m.status,
                  tempatLahir: m.tempatLahir || null,
                  tanggalLahir: m.tanggalLahir || null,
                  alamat: m.alamat || null,
                  pekerjaan: m.pekerjaan || null,
                  whatsapp: m.whatsapp || null,
                  email: m.email || "",
                  profilePhoto: m.profilePhoto || null
                }
              })
            }
          }

          // Seed AkunLogin
          if (seedData.simpa_login_accounts) {
            for (const a of seedData.simpa_login_accounts) {
              await prisma.akunLogin.upsert({
                where: { npa: a.npa },
                update: {},
                create: {
                  npa: a.npa,
                  name: a.name,
                  role: a.role,
                  passwordHash: a.passwordHash,
                  linkedAnggotaId: a.linkedAnggotaId
                }
              })
            }
          }

          // Seed ScheduledEvent
          if (seedData.simpa_scheduled_events) {
            for (const e of seedData.simpa_scheduled_events) {
              await prisma.scheduledEvent.upsert({
                where: { id: e.id },
                update: {},
                create: {
                  id: e.id,
                  title: e.title,
                  date: e.date,
                  time: e.time,
                  location: e.location,
                  color: e.color,
                  type: e.type || "umum",
                  speaker: e.speaker || null,
                  theme: e.theme || null
                }
              })
            }
          }

          // Seed Tasykil structure
          if (seedData.simpa_tasykil) {
            const tas = seedData.simpa_tasykil
            
            // penasehat
            if (tas.penasehat) {
              await prisma.penasehat.deleteMany({})
              for (let i = 0; i < tas.penasehat.length; i++) {
                await prisma.penasehat.create({
                  data: { name: tas.penasehat[i], sortOrder: i }
                })
              }
            }

            // pimhar
            if (tas.pimhar) {
              await prisma.pimhar.deleteMany({})
              const keys = Object.keys(tas.pimhar)
              for (const key of keys) {
                let dbKey = key
                if (key === "wakilKetua") dbKey = "wakil_ketua"
                if (key === "wakilSekretaris") dbKey = "wakil_sekretaris"
                if (key === "wakilBendahara") dbKey = "wakil_bendahara"
                const val = tas.pimhar[key]
                if (val) {
                  await prisma.pimhar.create({
                    data: { roleKey: dbKey, anggotaId: val }
                  })
                }
              }
            }

            // bidang
            if (tas.bidang) {
              await prisma.bidang.deleteMany({})
              for (const b of tas.bidang) {
                const newBidang = await prisma.bidang.create({
                  data: { id: b.id, name: b.name }
                })
                for (const mId of b.members) {
                  const exists = await prisma.anggota.findUnique({ where: { id: mId } })
                  if (exists) {
                    await prisma.anggotaBidang.create({
                      data: { bidangId: newBidang.id, anggotaId: mId }
                    })
                  }
                }
              }
            }
          }

          // Seed System Settings
          const settingsToSeed = ["simpa_wa_config", "simpa_periode_jabatan", "simpa_wa_template_kajian", "simpa_wa_template_umum"]
          for (const key of settingsToSeed) {
            if (seedData[key]) {
              await prisma.systemSetting.upsert({
                where: { key },
                update: {},
                create: {
                  key,
                  value: typeof seedData[key] === "string" ? seedData[key] : JSON.stringify(seedData[key])
                }
              })
            }
          }

        } catch (e) {
          console.error("Failed to parse or seed local db.json file:", e)
        }
      }

      // Re-trigger GET to pull correctly populated data
      const data = await fetchFreshData()
      return NextResponse.json({ status: true, data })
    }

    // 3. Compile output from Supabase relational tables & settings
    const compiledData = await compilePayload(
      dbAnggota,
      dbAkun,
      dbEvent,
      dbAcl,
      dbTemplate,
      dbPenasehat,
      dbPimhar,
      dbBidang,
      dbApplicants
    )

    return NextResponse.json({ status: true, data: compiledData })
  } catch (error: any) {
    console.error("GET /api/db-sync error:", error)
    return NextResponse.json({ status: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { key, value } = body

    if (!key) {
      return NextResponse.json({ status: false, reason: "Key is required" }, { status: 400 })
    }

    console.log(`POST /api/db-sync: Updating key "${key}" in Supabase...`)

    // Sync to Supabase relational tables or system setting table based on the key
    if (["simpa_wa_config", "simpa_periode_jabatan", "simpa_wa_template_kajian", "simpa_wa_template_umum"].includes(key)) {
      await prisma.systemSetting.upsert({
        where: { key },
        update: {
          value: typeof value === "string" ? value : JSON.stringify(value)
        },
        create: {
          key,
          value: typeof value === "string" ? value : JSON.stringify(value)
        }
      })
    } 
    else if (key === "simpa_members_state") {
      const members = value as any[]
      const currentIds = members.map(m => m.id)

      // Delete members that are NOT in the payload (except Super Admin)
      await prisma.anggota.deleteMany({
        where: {
          id: {
            notIn: currentIds,
            not: "26.0000"
          }
        }
      })

      // Upsert current members
      for (const m of members) {
        await prisma.anggota.upsert({
          where: { id: m.id },
          update: {
            name: m.name,
            status: m.status,
            tempatLahir: m.tempatLahir || null,
            tanggalLahir: m.tanggalLahir || null,
            alamat: m.alamat || null,
            rtRw: m.rtRw || null,
            kelDesa: m.kelDesa || null,
            kecamatan: m.kecamatan || null,
            kabKota: m.kabKota || null,
            pekerjaan: m.pekerjaan || null,
            whatsapp: m.whatsapp || null,
            email: m.email || "",
            profilePhoto: m.profilePhoto || null,
            bergabungTahun: m.bergabungTahun || null
          },
          create: {
            id: m.id,
            name: m.name,
            status: m.status,
            tempatLahir: m.tempatLahir || null,
            tanggalLahir: m.tanggalLahir || null,
            alamat: m.alamat || null,
            rtRw: m.rtRw || null,
            kelDesa: m.kelDesa || null,
            kecamatan: m.kecamatan || null,
            kabKota: m.kabKota || null,
            pekerjaan: m.pekerjaan || null,
            whatsapp: m.whatsapp || null,
            email: m.email || "",
            profilePhoto: m.profilePhoto || null,
            bergabungTahun: m.bergabungTahun || null,
            createdAt: m.createdAt ? new Date(m.createdAt) : new Date()
          }
        })
      }
    } 
    else if (key === "simpa_login_accounts") {
      const accounts = value as any[]
      const currentNpas = accounts.map(a => a.npa)

      // Delete old accounts
      await prisma.akunLogin.deleteMany({
        where: {
          npa: {
            notIn: currentNpas
          }
        }
      })

      // Upsert current accounts
      for (const a of accounts) {
        let validLinkedId = null
        if (a.linkedAnggotaId) {
          const mExists = await prisma.anggota.findUnique({ where: { id: a.linkedAnggotaId } })
          if (mExists) {
            validLinkedId = a.linkedAnggotaId
          }
        }

        await prisma.akunLogin.upsert({
          where: { npa: a.npa },
          update: {
            name: a.name,
            role: a.role,
            passwordHash: a.passwordHash,
            linkedAnggotaId: validLinkedId
          },
          create: {
            npa: a.npa,
            name: a.name,
            role: a.role,
            passwordHash: a.passwordHash,
            linkedAnggotaId: validLinkedId
          }
        })
      }
    } 
    else if (key === "simpa_scheduled_events") {
      const events = value as any[]
      const currentIds = events.map(e => e.id)

      // Delete removed events
      await prisma.scheduledEvent.deleteMany({
        where: {
          id: {
            notIn: currentIds
          }
        }
      })

      // Upsert current events
      for (const e of events) {
        await prisma.scheduledEvent.upsert({
          where: { id: e.id },
          update: {
            title: e.title,
            date: e.date,
            time: e.time,
            location: e.location,
            color: e.color,
            type: e.type || "umum",
            speaker: e.speaker || null,
            theme: e.theme || null
          },
          create: {
            id: e.id,
            title: e.title,
            date: e.date,
            time: e.time,
            location: e.location,
            color: e.color,
            type: e.type || "umum",
            speaker: e.speaker || null,
            theme: e.theme || null
          }
        })
      }
    } 
    else if (key === "simpa_calon_anggota") {
      const applicants = value as any[]
      const currentIds = applicants.map(a => a.id)

      // Delete removed applicants
      await prisma.applicant.deleteMany({
        where: {
          id: {
            notIn: currentIds
          }
        }
      })

      // Upsert current applicants
      for (const a of applicants) {
        await prisma.applicant.upsert({
          where: { id: a.id },
          update: {
            name: a.name,
            date: a.date,
            contact: a.contact,
            status: a.status,
            tempatLahir: a.tempatLahir,
            tanggalLahir: a.tanggalLahir,
            alamat: a.alamat,
            pekerjaan: a.pekerjaan
          },
          create: {
            id: a.id,
            name: a.name,
            date: a.date,
            contact: a.contact,
            status: a.status,
            tempatLahir: a.tempatLahir,
            tanggalLahir: a.tanggalLahir,
            alamat: a.alamat,
            pekerjaan: a.pekerjaan
          }
        })
      }
    }
    else if (key === "simpa_acl_rules") {
      const acls = value as any[]
      for (const r of acls) {
        await prisma.roleAkses.upsert({
          where: { roleName: r.role },
          update: {
            allowDashboard: typeof r.permissions.dashboard !== "undefined" ? r.permissions.dashboard : r.permissions.allowDashboard,
            viewDataAnggota: r.permissions.viewDataAnggota,
            manageDataAnggota: r.permissions.manageDataAnggota,
            viewTasykil: r.permissions.viewTasykil,
            manageTasykil: r.permissions.manageTasykil,
            viewCalonAnggota: r.permissions.viewCalonAnggota,
            manageCalonAnggota: r.permissions.manageCalonAnggota,
            viewJadwalKegiatan: r.permissions.viewJadwalKegiatan,
            manageJadwalKegiatan: r.permissions.manageJadwalKegiatan,
            viewPengaturan: r.permissions.viewPengaturan,
            managePengaturan: r.permissions.managePengaturan
          },
          create: {
            roleName: r.role,
            allowDashboard: typeof r.permissions.dashboard !== "undefined" ? r.permissions.dashboard : r.permissions.allowDashboard,
            viewDataAnggota: r.permissions.viewDataAnggota,
            manageDataAnggota: r.permissions.manageDataAnggota,
            viewTasykil: r.permissions.viewTasykil,
            manageTasykil: r.permissions.manageTasykil,
            viewCalonAnggota: r.permissions.viewCalonAnggota,
            manageCalonAnggota: r.permissions.manageCalonAnggota,
            viewJadwalKegiatan: r.permissions.viewJadwalKegiatan,
            manageJadwalKegiatan: r.permissions.manageJadwalKegiatan,
            viewPengaturan: r.permissions.viewPengaturan,
            managePengaturan: r.permissions.managePengaturan
          }
        })
      }
    } 
    else if (key === "simpa_tasykil") {
      const tas = value as any
      
      // Update Penasehat
      if (tas.penasehat) {
        await prisma.penasehat.deleteMany({})
        for (let i = 0; i < tas.penasehat.length; i++) {
          await prisma.penasehat.create({
            data: { name: tas.penasehat[i], sortOrder: i }
          })
        }
      }

      // Update Pimhar
      if (tas.pimhar) {
        await prisma.pimhar.deleteMany({})
        const keys = Object.keys(tas.pimhar)
        for (const key of keys) {
          let dbKey = key
          if (key === "wakilKetua") dbKey = "wakil_ketua"
          if (key === "wakilSekretaris") dbKey = "wakil_sekretaris"
          if (key === "wakilBendahara") dbKey = "wakil_bendahara"
          const val = tas.pimhar[key]
          if (val) {
            const mExists = await prisma.anggota.findUnique({ where: { id: val } })
            if (mExists) {
              await prisma.pimhar.create({
                data: { roleKey: dbKey, anggotaId: val }
              })
            }
          }
        }
      }

      // Update Bidang
      if (tas.bidang) {
        await prisma.bidang.deleteMany({})
        for (const b of tas.bidang) {
          const newBidang = await prisma.bidang.create({
            data: { id: b.id, name: b.name }
          })
          for (const mId of b.members) {
            const mExists = await prisma.anggota.findUnique({ where: { id: mId } })
            if (mExists) {
              await prisma.anggotaBidang.create({
                data: { bidangId: newBidang.id, anggotaId: mId }
              })
            }
          }
        }
      }
    } 
    else if (key === "simpa_kta_settings") {
      const s = value as any
      await prisma.ktaSettings.upsert({
        where: { id: "default" },
        update: { ketuaName: s.ketuaName || "", ketuaNpa: s.ketuaNpa || "", signatureUrl: s.signatureUrl || "" },
        create: { id: "default", ketuaName: s.ketuaName || "", ketuaNpa: s.ketuaNpa || "", signatureUrl: s.signatureUrl || "" }
      })
    }
    else if (key === "simpa_wa_template") {
      const content = value as string
      const first = await prisma.waTemplate.findFirst()
      if (first) {
        await prisma.waTemplate.update({
          where: { id: first.id },
          data: { content }
        })
      } else {
        await prisma.waTemplate.create({
          data: { id: "default", content }
        })
      }
    }

    return NextResponse.json({ status: true })
  } catch (error: any) {
    console.error("POST /api/db-sync error:", error)
    return NextResponse.json({ status: false, error: error.message }, { status: 500 })
  }
}

// Fetch helper to avoid duplicate DB query blocks
async function fetchFreshData() {
  const dbAnggota = await prisma.anggota.findMany()
  const dbAkun = await prisma.akunLogin.findMany()
  const dbEvent = await prisma.scheduledEvent.findMany()
  const dbAcl = await prisma.roleAkses.findMany()
  const dbTemplate = await prisma.waTemplate.findFirst()
  const dbPenasehat = await prisma.penasehat.findMany({ orderBy: { sortOrder: "asc" } })
  const dbPimhar = await prisma.pimhar.findMany()
  const dbBidang = await prisma.bidang.findMany({ include: { members: true } })
  const dbApplicants = await prisma.applicant.findMany()
  const dbKtaSettings = await prisma.ktaSettings.findFirst()

  return compilePayload(
    dbAnggota,
    dbAkun,
    dbEvent,
    dbAcl,
    dbTemplate,
    dbPenasehat,
    dbPimhar,
    dbBidang,
    dbApplicants,
    dbKtaSettings
  )
}

// Map relational tables back to frontend mock-db format
async function compilePayload(
  dbAnggota: any[],
  dbAkun: any[],
  dbEvent: any[],
  dbAcl: any[],
  dbTemplate: any | null,
  dbPenasehat: any[],
  dbPimhar: any[],
  dbBidang: any[],
  dbApplicants: any[],
  dbKtaSettings: any | null
) {
  // tasykil.pimhar
  const pimharMap = {
    ketua: "",
    wakilKetua: "",
    sekretaris: "",
    wakilSekretaris: "",
    bendahara: "",
    wakilBendahara: ""
  }
  dbPimhar.forEach(p => {
    let key = p.roleKey
    if (key === "wakil_ketua") key = "wakilKetua"
    if (key === "wakil_sekretaris") key = "wakilSekretaris"
    if (key === "wakil_bendahara") key = "wakilBendahara"
    if (p.anggotaId && key in pimharMap) {
      pimharMap[key as keyof typeof pimharMap] = p.anggotaId
    }
  })

  // tasykil.bidang
  const bidangList = dbBidang.map(b => ({
    id: b.id,
    name: b.name,
    members: b.members.map((m: any) => m.anggotaId)
  }))

  // tasykil.penasehat
  const penasehatList = dbPenasehat.map(p => p.name)

  const simpa_tasykil = {
    penasehat: penasehatList,
    pimhar: pimharMap,
    bidang: bidangList
  }

  // Members state (sync roles dynamically)
  const membersRaw = dbAnggota.map(a => ({
    id: a.id,
    name: a.name,
    role: "-",
    status: a.status,
    tempatLahir: a.tempatLahir || "",
    tanggalLahir: a.tanggalLahir || "",
    alamat: a.alamat || "",
    rtRw: a.rtRw || "",
    kelDesa: a.kelDesa || "",
    kecamatan: a.kecamatan || "",
    pekerjaan: a.pekerjaan || "",
    whatsapp: a.whatsapp || "",
    email: a.email || "",
    profilePhoto: a.profilePhoto || "",
    bergabungTahun: a.bergabungTahun || "",
    createdAt: a.createdAt ? a.createdAt.toISOString() : new Date().toISOString()
  }))

  const simpa_members_state = membersRaw.map(m => {
    if (m.id === "26.0000") return { ...m, role: "Super Admin" }
    if (simpa_tasykil.pimhar.ketua === m.id) return { ...m, role: "Ketua" }
    if (simpa_tasykil.pimhar.wakilKetua === m.id) return { ...m, role: "Wakil Ketua" }
    if (simpa_tasykil.pimhar.sekretaris === m.id) return { ...m, role: "Sekretaris" }
    if (simpa_tasykil.pimhar.wakilSekretaris === m.id) return { ...m, role: "Wakil Sekretaris" }
    if (simpa_tasykil.pimhar.bendahara === m.id) return { ...m, role: "Bendahara" }
    if (simpa_tasykil.pimhar.wakilBendahara === m.id) return { ...m, role: "Wakil Bendahara" }

    for (const b of simpa_tasykil.bidang) {
      if (b.members.includes(m.id)) {
        return { ...m, role: b.name }
      }
    }
    return m
  })

  // Accounts
  const simpa_login_accounts = dbAkun.map(a => ({
    npa: a.npa,
    name: a.name,
    role: a.role,
    passwordHash: a.passwordHash,
    linkedAnggotaId: a.linkedAnggotaId
  }))

  // Scheduled events
  const simpa_scheduled_events = dbEvent.map(e => ({
    id: e.id,
    title: e.title,
    date: e.date,
    time: e.time,
    location: e.location,
    color: e.color,
    type: e.type || "umum",
    speaker: e.speaker || undefined,
    theme: e.theme || undefined,
    notificationCount: e.notificationCount
  }))

  // ACL Rules
  const simpa_acl_rules = dbAcl.map(a => ({
    role: a.roleName,
    permissions: {
      dashboard: a.allowDashboard,
      viewDataAnggota: a.viewDataAnggota,
      manageDataAnggota: a.manageDataAnggota,
      viewTasykil: a.viewTasykil,
      manageTasykil: a.manageTasykil,
      viewCalonAnggota: a.viewCalonAnggota,
      manageCalonAnggota: a.manageCalonAnggota,
      viewJadwalKegiatan: a.viewJadwalKegiatan,
      manageJadwalKegiatan: a.manageJadwalKegiatan,
      viewPengaturan: a.viewPengaturan,
      managePengaturan: a.managePengaturan
    }
  }))

  // Fetch settings from Supabase
  const settingsMap: Record<string, string> = {}
  try {
    const dbSettings = await prisma.systemSetting.findMany()
    dbSettings.forEach(s => {
      settingsMap[s.key] = s.value
    })
  } catch (e) {
    console.error("Error fetching system settings from Supabase:", e)
  }

  // Parse config safely
  let waConfig = null
  if (settingsMap["simpa_wa_config"]) {
    try {
      waConfig = JSON.parse(settingsMap["simpa_wa_config"])
    } catch (e) {}
  }

  // Applicants
  const simpa_calon_anggota = dbApplicants.map(a => ({
    id: a.id,
    name: a.name,
    date: a.date,
    contact: a.contact,
    status: a.status,
    tempatLahir: a.tempatLahir,
    tanggalLahir: a.tanggalLahir,
    alamat: a.alamat,
    pekerjaan: a.pekerjaan
  }))

  return {
    simpa_members_state,
    simpa_login_accounts,
    simpa_scheduled_events,
    simpa_tasykil,
    simpa_acl_rules,
    simpa_calon_anggota,
    simpa_kta_settings: dbKtaSettings ? { ketuaName: dbKtaSettings.ketuaName, ketuaNpa: dbKtaSettings.ketuaNpa, signatureUrl: dbKtaSettings.signatureUrl } : { ketuaName: "", ketuaNpa: "", signatureUrl: "" },
    simpa_wa_template: dbTemplate?.content || "",
    simpa_wa_config: waConfig,
    simpa_periode_jabatan: settingsMap["simpa_periode_jabatan"] || "",
    simpa_wa_template_kajian: settingsMap["simpa_wa_template_kajian"] || "",
    simpa_wa_template_umum: settingsMap["simpa_wa_template_umum"] || ""
  }
}
