const qrcode = require("qrcode-terminal");
const os = require("os");
const { Client, LocalAuth } = require("whatsapp-web.js");

let whatsappClient;

// Determine system Chrome path manually (cross-platform)
function getChromePath() {
  const platform = os.platform();

  switch (platform) {
    case "darwin":
      return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    case "win32":
      return "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
    case "linux":
      return "/usr/bin/google-chrome";
    default:
      throw new Error("❌ Unsupported OS. Please install Google Chrome.");
  }
}

function startWhatsAppClient() {
  const chromePath = getChromePath();

  whatsappClient = new Client({
    authStrategy: new LocalAuth({
  dataPath: './session_data'  // <-- this will work outside the .pkg snapshot
}),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: chromePath,
       dumpio: true,
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
