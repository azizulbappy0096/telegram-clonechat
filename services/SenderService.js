const logger = require("./LoggerService");
const config = require("../config/telegram");
const withFloodWait = require("../utils/floodWait");
const sleep = require("../utils/sleep");

class SenderService {
  constructor(client, sendDelayMs = config.sendDelayMs) {
    this.client = client;
    this.sendDelayMs = sendDelayMs;
    this.nextSendAt = 0;
  }

  async sendMessage(destination, options) {
    return this.execute(async () => {
      logger.info(`Sending message to ${destination.title || destination.id}`);

      return await this.client.sendMessage(destination, options);
    });
  }

  async sendFile(destination, options) {
    return this.execute(async () => {
      logger.info(`Uploading file to ${destination.title || destination.id}`);

      return await this.client.sendFile(destination, options);
    });
  }

  async execute(fn) {
    const remainingDelay = this.nextSendAt - Date.now();
    if (remainingDelay > 0) {
      await sleep(remainingDelay);
    }

    const result = await withFloodWait(fn, "Sending message");
    this.nextSendAt = Date.now() + this.sendDelayMs;

    return result;
  }
}

module.exports = SenderService;
