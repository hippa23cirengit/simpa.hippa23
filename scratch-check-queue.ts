import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    content.split("\n").forEach(line => {
      const match = line.match(/^\s*([\w.\-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || "";
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value;
      }
    });
    console.log("Loaded environment from .env.local");
  } else {
    console.log("Could not find .env.local at", envPath);
  }
}

async function main() {
  loadEnv();
  
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  
  try {
    const queue = await prisma.waQueue.findMany({
      orderBy: { createdAt: "desc" },
      take: 5
    });
    console.log("----------------------------------------");
    console.log("Last 5 WaQueue items:");
    queue.forEach((item, index) => {
      console.log(`\n--- Queue Item #${index + 1} ---`);
      console.log(`ID: ${item.id}`);
      console.log(`To: ${item.to}`);
      console.log(`Status: ${item.status}`);
      console.log(`Created At: ${item.createdAt}`);
      console.log("Message Content:");
      console.log(item.message);
    });
    console.log("----------------------------------------");
  } catch (error) {
    console.error("Error querying queue:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
