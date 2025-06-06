const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");
const https = require("https");

function checkInternet(cb) {
  https
    .get("https://www.google.com", () => cb(true))
    .on("error", () => cb(false));
}

checkInternet((isConnected) => {
  if (!isConnected) {
    console.log("❌ No internet connection. Skipping WhatsApp initialization.");
    return;
  }

  console.log("🚀 Starting WhatsApp client...");

  const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true, // 👈 set to false to debug with browser
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      timeout: 60000,
      executablePath:
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    },
  });

  client.on("qr", (qr) => {
    console.log("📱 Scan this QR code to authenticate:");
    qrcode.generate(qr, { small: true });
  });

  client.on("authenticated", () => {
    console.log("🔐 Authenticated successfully");
  });

  client.on("auth_failure", (msg) => {
    console.error("❌ Authentication failure:", msg);
  });

  client.on("ready", () => {
    console.log("✅ WhatsApp Client is ready!");
  });

  client.on("disconnected", (reason) => {
    console.log("🚫 Disconnected from WhatsApp:", reason);
  });

  client.initialize();
});
