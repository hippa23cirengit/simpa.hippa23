import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as bcrypt from "bcrypt";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting database seed...");

  // Clean up all tables first to avoid duplicates or legacy records
  console.log("Cleaning up existing database records...");
  await prisma.pimhar.deleteMany({});
  await prisma.anggotaBidang.deleteMany({});
  await prisma.akunLogin.deleteMany({});
  await prisma.anggota.deleteMany({});
  await prisma.bidang.deleteMany({});
  await prisma.penasehat.deleteMany({});
  await prisma.scheduledEvent.deleteMany({});
  await prisma.applicant.deleteMany({});

  // 1. Seed Role Akses (ACL)
  console.log("Seeding RoleAkses...");
  await prisma.roleAkses.upsert({
    where: { roleName: "Super Admin" },
    update: {},
    create: {
      roleName: "Super Admin",
      allowDashboard: true,
      allowDataAnggota: true,
      allowTasykil: true,
      allowCalonAnggota: true,
      allowJadwalKegiatan: true,
      allowPengaturan: true,
    },
  });

  await prisma.roleAkses.upsert({
    where: { roleName: "PIMHAR" },
    update: {},
    create: {
      roleName: "PIMHAR",
      allowDashboard: true,
      allowDataAnggota: true,
      allowTasykil: true,
      allowCalonAnggota: true,
      allowJadwalKegiatan: true,
      allowPengaturan: true,
    },
  });

  await prisma.roleAkses.upsert({
    where: { roleName: "Bidang" },
    update: {},
    create: {
      roleName: "Bidang",
      allowDashboard: true,
      allowDataAnggota: true,
      allowTasykil: true,
      allowCalonAnggota: true,
      allowJadwalKegiatan: true,
      allowPengaturan: false,
    },
  });

  await prisma.roleAkses.upsert({
    where: { roleName: "Anggota" },
    update: {},
    create: {
      roleName: "Anggota",
      allowDashboard: true,
      allowDataAnggota: true,
      allowTasykil: true,
      allowCalonAnggota: true,
      allowJadwalKegiatan: true,
      allowPengaturan: false,
    },
  });

  // 2. Seed Bidang
  console.log("Seeding Bidang...");
  await prisma.bidang.upsert({
    where: { id: "bidang-kaderisasi" },
    update: {},
    create: { id: "bidang-kaderisasi", name: "Bidang Kaderisasi" },
  });

  await prisma.bidang.upsert({
    where: { id: "bidang-pendidikan" },
    update: {},
    create: { id: "bidang-pendidikan", name: "Bidang Pendidikan" },
  });

  await prisma.bidang.upsert({
    where: { id: "bidang-organisasi" },
    update: {},
    create: { id: "bidang-organisasi", name: "Bidang Organisasi" },
  });

  await prisma.bidang.upsert({
    where: { id: "bidang-sosial" },
    update: {},
    create: { id: "bidang-sosial", name: "Bidang Sosial" },
  });

  // 3. Seed Anggota
  console.log("Seeding Anggota & AkunLogin...");
  const defaultPasswordHash = await bcrypt.hash("cirengit23", 10);

  const mockMembers = [
    {
      id: "26.0000",
      name: "Najmi Shofwan Al-Azhar",
      status: "Aktif",
      tempatLahir: "Bandung",
      tanggalLahir: "2001-04-12",
      alamat: "Bandung",
      pekerjaan: "Super Admin",
      whatsapp: "0812-3456-7890",
      email: "najmi.alazhar@gmail.com",
      loginRole: "Super Admin",
    },
  ];

  for (const m of mockMembers) {
    await prisma.anggota.upsert({
      where: { id: m.id },
      update: {},
      create: {
        id: m.id,
        name: m.name,
        status: m.status,
        tempatLahir: m.tempatLahir,
        tanggalLahir: m.tanggalLahir,
        alamat: m.alamat,
        pekerjaan: m.pekerjaan,
        whatsapp: m.whatsapp,
        email: m.email,
      },
    });

    await prisma.akunLogin.upsert({
      where: { anggotaId: m.id },
      update: {},
      create: {
        anggotaId: m.id,
        passwordHash: defaultPasswordHash,
        role: m.loginRole,
      },
    });
  }

  // 4. Seed PIMHAR
  console.log("Skipping Pimhar relations (start clean)...");

  // 5. Seed AnggotaBidang
  console.log("Skipping AnggotaBidang relations (start clean)...");

  // 6. Seed Penasehat
  console.log("Seeding Penasehat...");
  const penasehatList = [
    { name: "Ust. H. Ahmad Gozali", sortOrder: 1 },
    { name: "Ust. KH. Aceng Zakaria", sortOrder: 2 },
  ];

  for (const p of penasehatList) {
    await prisma.penasehat.create({
      data: p,
    });
  }

  // 7. Seed ScheduledEvent
  console.log("Seeding ScheduledEvent...");
  const eventList = [
    {
      title: "Rapat Pengurus Bulanan",
      date: "2026-08-20",
      time: "09:00",
      location: "Ruang Rapat Utama",
      color: "blue",
    },
    {
      title: "Kajian Rutin Mingguan",
      date: "2026-08-22",
      time: "16:00",
      location: "Masjid Al-Ikhlas",
      color: "emerald",
    },
  ];

  for (const e of eventList) {
    await prisma.scheduledEvent.create({
      data: e,
    });
  }

  // 8. Seed Calon Anggota (Applicants)
  console.log("Seeding Applicants...");
  const applicants = [
    {
      name: "Rian Hidayat",
      date: "2026-08-18",
      contact: "0812-1111-2222",
      status: "Menunggu",
      tempatLahir: "Bandung",
      tanggalLahir: "2003-05-10",
      alamat: "Kp. Cirengit RT 01/RW 04, Cirengit",
      pekerjaan: "Pelajar",
    },
    {
      name: "Dede Yusuf",
      date: "2026-08-17",
      contact: "0877-3333-4444",
      status: "Proses",
      tempatLahir: "Bandung",
      tanggalLahir: "2002-12-05",
      alamat: "Jl. Raya Cirengit No. 10",
      pekerjaan: "Mahasiswa",
    },
  ];

  for (const a of applicants) {
    await prisma.applicant.create({
      data: a,
    });
  }

  // 9. Seed WhatsApp template
  console.log("Seeding WaTemplate...");
  await prisma.waTemplate.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      content: "Yth. *{nama}*, Kami informasikan bahwa ada kegiatan *{kegiatan}* pada tanggal *{tanggal}* pukul *{waktu}* bertempat di *{lokasi}*. Kehadiran Anda sangat kami harapkan. Terima kasih.",
    },
  });

  console.log("Database seed completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
