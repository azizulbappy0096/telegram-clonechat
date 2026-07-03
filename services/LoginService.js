const fs = require("fs");
const path = require("path");

const input = require("input");

const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");

const logger = require("./LoggerService");
const config = require("../config/telegram");

const SESSION_PATH = path.join(process.cwd(), "session.txt");

class LoginService {
  constructor() {
    this.client = null;
  }

  loadSession() {
    if (!fs.existsSync(SESSION_PATH)) {
      return "";
    }

    return fs.readFileSync(SESSION_PATH, "utf8");
  }

  saveSession(session) {
    fs.writeFileSync(SESSION_PATH, session);
  }

  async login() {
    const stringSession = new StringSession(this.loadSession());

    this.client = new TelegramClient(
      stringSession,
      config.apiId,
      config.apiHash,
      {
        connectionRetries: 5,
      },
    );
    // this.client.sendMess
    await this.client.start({
      phoneNumber: async () => await input.text("Phone Number: "),

      password: async () => await input.text("2FA Password: "),

      phoneCode: async () => await input.text("Verification Code: "),

      onError: (err) => logger.error(err),
    });

    this.saveSession(this.client.session.save());

    logger.info("Telegram login successful.");

    return this.client;
  }
}

module.exports = new LoginService();
