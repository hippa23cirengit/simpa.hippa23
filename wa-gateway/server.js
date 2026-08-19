const express = require("express");
const cors = require("cors");
const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");

const app = express();
const PORT = process.env.PORT || 5000;

// Secret API Token to prevent unauthorized sending
const API_TOKEN = process.env.API_TOKEN || "cirengit-super-secret-wa-token-123";

app.use(cors());
app.use(express.json());

// Determine if we are running in a cloud/production environment
const isCloud = process.env.PORT || process.env.RENDER || process.env.NODE_ENV === "production";

// Minimal args for local visual testing, heavy sandbox/process flags for cloud
const puppeteerArgs = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
];

if (isCloud) {
  puppeteerArgs.push(
    "--disable-dev-shm-usage",
    "--disable-accelerated-2d-canvas",
    "--no-first-run",
    "--no-zygote",
    "--single-process",
    "--disable-gpu",
    "--use-gl=egl"
  );
}

// Initialize WhatsApp Web Client
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: "./.wwebjs_auth"
  }),
  webVersionCache: {
    type: "remote",
    remotePath: "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html"
  },
  puppeteer: {
    headless: isCloud ? true : false, // Pops up Chrome locally for easy QR scanning and 100% stability
    args: puppeteerArgs
  }
});

let isReady = false;

// Generate QR Code for scanning
client.on("qr", (qr) => {
  console.log("\n=======================================================");
  console.log("SCAN QR CODE BERIKUT DENGAN WHATSAPP ANDA (LINKED DEVICES):");
  console.log("=======================================================\n");
  qrcode.generate(qr, { small: true });
  console.log("\n=======================================================\n");
});

// Authentication successful
client.on("authenticated", () => {
  console.log("Otentikasi WhatsApp Berhasil!");
});

client.on("auth_failure", (msg) => {
  console.error("Gagal otentikasi WhatsApp:", msg);
});

// Client is ready to send messages
client.on("ready", () => {
  console.log("\n=======================================================");
  console.log("WHATSAPP GATEWAY READY & CONNECTED!");
  console.log("=======================================================\n");
  isReady = true;
});

// Handle disconnected event
client.on("disconnected", (reason) => {
  console.log("WhatsApp terputus:", reason);
  isReady = false;
  // Re-initialize
  client.initialize();
});

// Initialize WA Client
client.initialize();

// REST API Endpoints
app.get("/status", (req, res) => {
  res.json({
    status: true,
    whatsappReady: isReady,
    message: isReady ? "Gateway is connected and ready." : "Gateway is starting or disconnected."
  });
});

app.post("/send", async (req, res) => {
  const { to, message, token } = req.body;

  // Validate Secret Token
  if (!token || token.trim() !== API_TOKEN) {
    return res.status(401).json({
      status: false,
      reason: "Unauthorized. Token API tidak valid atau tidak diisi."
    });
  }

  // Validate WhatsApp Readiness
  if (!isReady) {
    return res.status(503).json({
      status: false,
      reason: "WhatsApp Gateway belum siap / belum terhubung. Silakan scan QR Code terlebih dahulu."
    });
  }

  // Validate Parameters
  if (!to || !message) {
    return res.status(400).json({
      status: false,
      reason: "Parameter 'to' dan 'message' wajib diisi."
    });
  }

  try {
    // Format recipient phone number to whatsapp JID format
    // E.g. '628123456789@c.us'
    let cleanNumber = to.trim().replace(/[^0-9]/g, "");
    if (cleanNumber.startsWith("0")) {
      cleanNumber = "62" + cleanNumber.slice(1);
    }
    const whatsappJID = `${cleanNumber}@c.us`;

    console.log(`Mengirim pesan ke: ${whatsappJID}...`);
    const sentMessage = await client.sendMessage(whatsappJID, message);

    const messageId = (sentMessage && sentMessage.id) ? sentMessage.id._serialized : `msg-local-${Date.now()}`;
    console.log(`Pesan terkirim ke server WhatsApp. ID: ${messageId}`);

    res.json({
      status: true,
      messageId: messageId,
      info: "Pesan berhasil terkirim!"
    });
  } catch (error) {
    console.error("Gagal mengirim WA:", error);
    res.status(500).json({
      status: false,
      reason: error.message || "Gagal mengirim pesan via WhatsApp Web."
    });
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`WA Gateway API Server berjalan di http://localhost:${PORT}`);
  console.log(`Secret Token Pengiriman: ${API_TOKEN}`);
});
