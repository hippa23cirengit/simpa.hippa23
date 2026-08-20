import "dotenv/config";
import { prisma } from "./src/infrastructure/prisma/prisma-client";

async function main() {
  console.log("🔄 Memulai proses reset limit notifikasi WA...");

  try {
    // 1. Reset notificationCount di ScheduledEvent menjadi 0
    const eventsUpdate = await prisma.scheduledEvent.updateMany({
      data: {
        notificationCount: 0
      }
    });
    console.log(`✅ Berhasil mereset limit notifikasi untuk ${eventsUpdate.count} kegiatan.`);

    // 2. Bersihkan tabel WaQueue
    const queueDelete = await prisma.waQueue.deleteMany({});
    console.log(`✅ Berhasil membersihkan ${queueDelete.count} pesan di antrean WA.`);

    console.log("\n✨ Selesai! Semua limit telah direset dan antrean telah dibersihkan. Silakan lakukan pengujian kembali.");
  } catch (error: any) {
    console.error("❌ Terjadi kesalahan saat melakukan reset:", error.message || error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
