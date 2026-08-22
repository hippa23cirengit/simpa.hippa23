import { prisma } from "./src/infrastructure/prisma/prisma-client";
import bcrypt from "bcrypt";

async function main() {
  const hash = await bcrypt.hash("123456", 10);
  await prisma.kasSetting.upsert({
    where: { id: "default" },
    update: { pinHash: hash },
    create: { id: "default", pinHash: hash }
  });
  console.log("PIN set to 123456");
}
main();
