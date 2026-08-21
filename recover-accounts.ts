import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const anggotas = await prisma.anggota.findMany();
  console.log(`Ditemukan ${anggotas.length} anggota di database.`);

  let recovered = 0;
  for (const m of anggotas) {
    // Check if account exists
    const existing = await prisma.akunLogin.findUnique({
      where: { npa: m.id }
    });

    if (!existing) {
      // Create new account based on logic in mock-db
      let role = "Anggota";
      if (m.id === "26.0000") role = "Super Admin";

      await prisma.akunLogin.create({
        data: {
          npa: m.id,
          name: m.name,
          role: role,
          passwordHash: "#h1ppa23",
          linkedAnggotaId: m.id
        }
      });
      recovered++;
      console.log(`Memulihkan akun: ${m.name} (${m.id})`);
    }
  }

  console.log(`Selesai! Berhasil memulihkan ${recovered} akun login.`);
}

main().finally(() => prisma.$disconnect());
