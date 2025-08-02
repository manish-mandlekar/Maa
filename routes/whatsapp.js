const qrcode = require("qrcode-terminal");
const os = require("os");
const { Client, LocalAuth } = require("whatsapp-web.js");

let whatsappClient;
let isInitializing = false;
let retryCount = 0;
const MAX_RETRIES = 3;

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

async function initializeWhatsAppClient() {
  if (isInitializing) return;
  isInitializing = true;

  try {
    const chromePath = getChromePath();

    whatsappClient = new Client({
      authStrategy: new LocalAuth({
        dataPath: "./session_data",
        clientId: "maa_computers_client",
      }),
      puppeteer: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
        ],
        executablePath: chromePath,
        defaultViewport: null,
        timeout: 60000,
      },
      qrMaxRetries: 3,
      restartOnAuthFail: true,
    });

    whatsappClient.on("qr", (qr) => {
      console.log("📱 Scan this QR code to authenticate:");
      qrcode.generate(qr, { small: true });
    });

    whatsappClient.on("authenticated", () => {
      console.log("🔐 WhatsApp authentication successful");
      retryCount = 0;
    });

    whatsappClient.on("ready", () => {
      console.log("✅ WhatsApp client is ready");
      isInitializing = false;
    });

    whatsappClient.on("auth_failure", async (msg) => {
      console.error("❌ WhatsApp authentication failed:", msg);
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        console.log(
          `🔄 Retrying authentication (${retryCount}/${MAX_RETRIES})...`
        );
        await restartWhatsAppClient();
      } else {
        console.error(
          "❌ Max retries reached. Please check your WhatsApp connection."
        );
      }
    });

    whatsappClient.on("disconnected", async (reason) => {
      console.log("🚫 WhatsApp disconnected:", reason);
      isInitializing = false;
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        console.log(
          `🔄 Attempting to reconnect (${retryCount}/${MAX_RETRIES})...`
        );
        await restartWhatsAppClient();
      }
    });

    await whatsappClient.initialize();
  } catch (error) {
    console.error("❌ Error initializing WhatsApp client:", error);
    isInitializing = false;
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      console.log(
        `🔄 Retrying initialization (${retryCount}/${MAX_RETRIES})...`
      );
      setTimeout(initializeWhatsAppClient, 5000);
    }
  }
}

async function restartWhatsAppClient() {
  try {
    if (whatsappClient) {
      await whatsappClient.destroy();
    }
    await initializeWhatsAppClient();
  } catch (error) {
    console.error("❌ Error restarting WhatsApp client:", error);
  }
}

function getWhatsAppClient() {
  if (!whatsappClient || !whatsappClient.pupPage) {
    console.log("⚠️ WhatsApp client not ready, initializing...");
    initializeWhatsAppClient();
    return null;
  }
  return whatsappClient;
}

// Export the functions
module.exports = {
  startWhatsAppClient: initializeWhatsAppClient,
  getWhatsAppClient,
  restartWhatsAppClient,
};
