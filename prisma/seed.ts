import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as bcrypt from "bcrypt";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
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
  const bidangKaderisasi = await prisma.bidang.upsert({
    where: { id: "bidang-kaderisasi" },
    update: {},
    create: { id: "bidang-kaderisasi", name: "Bidang Kaderisasi" },
  });

  const bidangPendidikan = await prisma.bidang.upsert({
    where: { id: "bidang-pendidikan" },
    update: {},
    create: { id: "bidang-pendidikan", name: "Bidang Pendidikan" },
  });

  const bidangOrganisasi = await prisma.bidang.upsert({
    where: { id: "bidang-organisasi" },
    update: {},
    create: { id: "bidang-organisasi", name: "Bidang Organisasi" },
  });

  const bidangSosial = await prisma.bidang.upsert({
    where: { id: "bidang-sosial" },
    update: {},
    create: { id: "bidang-sosial", name: "Bidang Sosial" },
  });

  // 3. Seed Anggota
  console.log("Seeding Anggota & AkunLogin...");
  const defaultPasswordHash = await bcrypt.hash("cirengit23", 10);

  const mockMembers = [
    {
      id: "23.001",
      name: "Ahmad Fauzan",
      status: "Aktif",
      tempatLahir: "Bandung",
      tanggalLahir: "2001-04-12",
      alamat: "Kp. Cirengit RT 02/RW 04, Desa Cirengit, Bandung",
      pekerjaan: "Mahasiswa",
      whatsapp: "0812-3456-7890",
      email: "ahmad.fauzan@gmail.com",
      loginRole: "Super Admin",
    },
    {
      id: "23.002",
      name: "Rizky Ibrahim",
      status: "Aktif",
      tempatLahir: "Garut",
      tanggalLahir: "2000-08-21",
      alamat: "Kp. Cirengit RT 01/RW 04, Desa Cirengit, Bandung",
      pekerjaan: "Wirausaha",
      whatsapp: "0821-9876-5432",
      email: "rizky.ibrahim@gmail.com",
      loginRole: "PIMHAR",
    },
    {
      id: "23.003",
      name: "Muhammad Ali",
      status: "Aktif",
      tempatLahir: "Bandung",
      tanggalLahir: "2002-11-03",
      alamat: "Perumahan Cirengit Indah Blok C No. 5, Bandung",
      pekerjaan: "Karyawan Swasta",
      whatsapp: "0852-1122-3344",
      email: "muhammad.ali@gmail.com",
      loginRole: "PIMHAR",
    },
    {
      id: "23.004",
      name: "Fajar Ramadhan",
      status: "Aktif",
      tempatLahir: "Sumedang",
      tanggalLahir: "2001-09-15",
      alamat: "Kp. Cirengit Kolot RT 03/RW 05, Desa Cirengit, Bandung",
      pekerjaan: "Mahasiswa",
      whatsapp: "0898-7654-3210",
      email: "fajar.ramadhan@gmail.com",
      loginRole: "Bidang",
    },
    {
      id: "23.005",
      name: "Ilham Saputra",
      status: "Aktif",
      tempatLahir: "Bandung",
      tanggalLahir: "2003-01-28",
      alamat: "Jl. Raya Cirengit No. 42, Bandung",
      pekerjaan: "Pelajar",
      whatsapp: "0877-2233-4455",
      email: "ilham.saputra@gmail.com",
      loginRole: "Bidang",
    },
    {
      id: "23.006",
      name: "Budi Santoso",
      status: "Aktif",
      tempatLahir: "Bandung",
      tanggalLahir: "1999-05-19",
      alamat: "Kp. Cirengit RT 04/RW 04, Desa Cirengit, Bandung",
      pekerjaan: "Wirausaha",
      whatsapp: "0813-9988-7766",
      email: "budi.santoso@gmail.com",
      loginRole: "Bidang",
    },
    {
      id: "23.007",
      name: "Ridwan Kamil",
      status: "Aktif",
      tempatLahir: "Bandung",
      tanggalLahir: "2000-06-06",
      alamat: "Jl. Cirengit Raya Blok F No. 12, Bandung",
      pekerjaan: "Karyawan Swasta",
      whatsapp: "0822-4433-2211",
      email: "ridwan.kamil@gmail.com",
      loginRole: "Bidang",
    },
    {
      id: "23.008",
      name: "Hasanuddin",
      status: "Aktif",
      tempatLahir: "Cianjur",
      tanggalLahir: "2002-12-12",
      alamat: "Kp. Pasir RT 02/RW 03, Cirengit, Bandung",
      pekerjaan: "Mahasiswa",
      whatsapp: "0812-7788-9900",
      email: "hasanuddin@gmail.com",
      loginRole: "Anggota",
    },
    {
      id: "23.009",
      name: "Cecep Solihin",
      status: "Tidak Aktif",
      tempatLahir: "Bandung",
      tanggalLahir: "2001-10-10",
      alamat: "Kp. Cirengit RT 02/RW 04, Desa Cirengit, Bandung",
      pekerjaan: "Wirausaha",
      whatsapp: "0838-1122-4455",
      email: "cecep.solihin@gmail.com",
      loginRole: "Anggota",
    },
    {
      id: "23.010",
      name: "Dadang Hermawan",
      status: "Aktif",
      tempatLahir: "Bandung",
      tanggalLahir: "2003-02-14",
      alamat: "Kp. Cirengit RT 03/RW 04, Desa Cirengit, Bandung",
      pekerjaan: "Pelajar",
      whatsapp: "0857-8899-0011",
      email: "dadang.hermawan@gmail.com",
      loginRole: "Anggota",
    },
    {
      id: "23.011",
      name: "Eman Sulaeman",
      status: "Aktif",
      tempatLahir: "Tasikmalaya",
      tanggalLahir: "2000-03-03",
      alamat: "Jl. Cirengit Baru No. 15, Bandung",
      pekerjaan: "Mahasiswa",
      whatsapp: "0896-1234-5678",
      email: "eman.sulaeman@gmail.com",
      loginRole: "Anggota",
    },
    {
      id: "23.012",
      name: "Fikri Ramadhan",
      status: "Alumni",
      tempatLahir: "Bandung",
      tanggalLahir: "1997-07-07",
      alamat: "Kp. Cirengit RT 01/RW 05, Desa Cirengit, Bandung",
      pekerjaan: "PNS",
      whatsapp: "0812-9900-1122",
      email: "fikri.ramadhan@gmail.com",
      loginRole: "Anggota",
    },
    {
      id: "23.013",
      name: "Ginanjar Kartasasmita",
      status: "Aktif",
      tempatLahir: "Bandung",
      tanggalLahir: "2002-05-05",
      alamat: "Perum Cirengit Blok A No. 1, Bandung",
      pekerjaan: "Mahasiswa",
      whatsapp: "0821-3344-5566",
      email: "ginanjar.kartasasmita@gmail.com",
      loginRole: "Anggota",
    },
    {
      id: "23.014",
      name: "Heri Hermawan",
      status: "Tidak Aktif",
      tempatLahir: "Bandung",
      tanggalLahir: "2001-11-11",
      alamat: "Kp. Pasir RT 01/RW 03, Cirengit, Bandung",
      pekerjaan: "Karyawan Swasta",
      whatsapp: "0852-6677-8899",
      email: "heri.hermawan@gmail.com",
      loginRole: "Anggota",
    },
    {
      id: "23.015",
      name: "Irfan Hakim",
      status: "Aktif",
      tempatLahir: "Sukabumi",
      tanggalLahir: "2000-09-09",
      alamat: "Jl. Cirengit Kolot RT 02/RW 05, Bandung",
      pekerjaan: "Wirausaha",
      whatsapp: "0878-5566-7788",
      email: "irfan.hakim@gmail.com",
      loginRole: "Anggota",
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
  console.log("Seeding Pimhar...");
  await prisma.pimhar.upsert({
    where: { roleKey: "ketua" },
    update: { anggotaId: "23.001" },
    create: { roleKey: "ketua", anggotaId: "23.001" },
  });

  await prisma.pimhar.upsert({
    where: { roleKey: "sekretaris" },
    update: { anggotaId: "23.002" },
    create: { roleKey: "sekretaris", anggotaId: "23.002" },
  });

  await prisma.pimhar.upsert({
    where: { roleKey: "bendahara" },
    update: { anggotaId: "23.003" },
    create: { roleKey: "bendahara", anggotaId: "23.003" },
  });

  // 5. Seed AnggotaBidang
  console.log("Seeding AnggotaBidang...");
  await prisma.anggotaBidang.upsert({
    where: { anggotaId: "23.004" },
    update: { bidangId: "bidang-kaderisasi" },
    create: { anggotaId: "23.004", bidangId: "bidang-kaderisasi" },
  });

  await prisma.anggotaBidang.upsert({
    where: { anggotaId: "23.005" },
    update: { bidangId: "bidang-pendidikan" },
    create: { anggotaId: "23.005", bidangId: "bidang-pendidikan" },
  });

  await prisma.anggotaBidang.upsert({
    where: { anggotaId: "23.006" },
    update: { bidangId: "bidang-organisasi" },
    create: { anggotaId: "23.006", bidangId: "bidang-organisasi" },
  });

  await prisma.anggotaBidang.upsert({
    where: { anggotaId: "23.007" },
    update: { bidangId: "bidang-sosial" },
    create: { anggotaId: "23.007", bidangId: "bidang-sosial" },
  });

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
