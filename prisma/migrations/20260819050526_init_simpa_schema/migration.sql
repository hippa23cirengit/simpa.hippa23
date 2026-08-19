-- CreateTable
CREATE TABLE "anggota" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "tempatLahir" TEXT,
    "tanggalLahir" TEXT,
    "alamat" TEXT,
    "pekerjaan" TEXT,
    "whatsapp" TEXT,
    "email" TEXT NOT NULL,

    CONSTRAINT "anggota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "penasehat" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "penasehat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pimhar" (
    "role_key" TEXT NOT NULL,
    "anggota_id" TEXT,

    CONSTRAINT "pimhar_pkey" PRIMARY KEY ("role_key")
);

-- CreateTable
CREATE TABLE "bidang" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "bidang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anggota_bidang" (
    "id" TEXT NOT NULL,
    "bidang_id" TEXT NOT NULL,
    "anggota_id" TEXT NOT NULL,

    CONSTRAINT "anggota_bidang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_akses" (
    "role_name" TEXT NOT NULL,
    "allow_dashboard" BOOLEAN NOT NULL DEFAULT true,
    "allow_data_anggota" BOOLEAN NOT NULL DEFAULT false,
    "allow_tasykil" BOOLEAN NOT NULL DEFAULT false,
    "allow_calon_anggota" BOOLEAN NOT NULL DEFAULT false,
    "allow_jadwal_kegiatan" BOOLEAN NOT NULL DEFAULT true,
    "allow_pengaturan" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "role_akses_pkey" PRIMARY KEY ("role_name")
);

-- CreateTable
CREATE TABLE "akun_login" (
    "anggota_id" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Anggota',

    CONSTRAINT "akun_login_pkey" PRIMARY KEY ("anggota_id")
);

-- CreateTable
CREATE TABLE "scheduled_event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "scheduled_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applicant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "tempatLahir" TEXT NOT NULL,
    "tanggalLahir" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "pekerjaan" TEXT NOT NULL,

    CONSTRAINT "applicant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wa_template" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "content" TEXT NOT NULL,

    CONSTRAINT "wa_template_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pimhar_anggota_id_key" ON "pimhar"("anggota_id");

-- CreateIndex
CREATE UNIQUE INDEX "anggota_bidang_anggota_id_key" ON "anggota_bidang"("anggota_id");

-- AddForeignKey
ALTER TABLE "pimhar" ADD CONSTRAINT "pimhar_anggota_id_fkey" FOREIGN KEY ("anggota_id") REFERENCES "anggota"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anggota_bidang" ADD CONSTRAINT "anggota_bidang_bidang_id_fkey" FOREIGN KEY ("bidang_id") REFERENCES "bidang"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anggota_bidang" ADD CONSTRAINT "anggota_bidang_anggota_id_fkey" FOREIGN KEY ("anggota_id") REFERENCES "anggota"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "akun_login" ADD CONSTRAINT "akun_login_anggota_id_fkey" FOREIGN KEY ("anggota_id") REFERENCES "anggota"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "akun_login" ADD CONSTRAINT "akun_login_role_fkey" FOREIGN KEY ("role") REFERENCES "role_akses"("role_name") ON DELETE RESTRICT ON UPDATE CASCADE;
