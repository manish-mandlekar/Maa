// whatsappClient.js
const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");

let whatsappClient;

function startWhatsAppClient() {
  whatsappClient = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath:
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    },
  });

  whatsappClient.on("qr", (qr) => {
    console.log("📱 Scan this QR code to authenticate:");
    qrcode.generate(qr, { small: true });
  });

  whatsappClient.on("authenticated", () => {
    console.log("🔐 Authenticated successfully");
  });

  whatsappClient.on("ready", () => {
    console.log("✅ WhatsApp client is ready");
  });

  whatsappClient.on("auth_failure", (msg) => {
    console.error("❌ Authentication failure:", msg);
  });

  whatsappClient.on("disconnected", (reason) => {
    console.log("🚫 Disconnected from WhatsApp:", reason);
  });

  whatsappClient.initialize();
}

module.exports = {
  startWhatsAppClient,
  getWhatsAppClient: () => whatsappClient,
};
