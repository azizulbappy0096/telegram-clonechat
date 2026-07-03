const { FloodWaitError } = require("telegram/errors");

const logger = require("./LoggerService");

class SenderService {
  constructor(client) {
    this.client = client;
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
    while (true) {
      try {
        return await fn();
      } catch (error) {
        if (error instanceof FloodWaitError) {
          const seconds = error.seconds;

          logger.warn(`FloodWait ${seconds}s`);

          await this.sleep(seconds * 1000);

          continue;
        }

        throw error;
      }
    }
  }

  sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}

module.exports = SenderService;
